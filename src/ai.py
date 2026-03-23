import re
import os
import json
from src.db import database
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from bson import ObjectId
from src.schemas import Context_history
from langchain_ollama import OllamaLLM
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser

gemini_llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-pro",
    api_key=os.getenv("API_KEY")
)

ollama_gemma2_llm = OllamaLLM(model="gemma2:2b")
ollama_phi3_llm = OllamaLLM(model="phi3")

groq_llm = ChatGroq(
    model="qwen3.5",
    api_key=os.getenv("GROQ_API")
)


async def get_context(context: str) -> str:
    prompt_template = """
        Conversation: {context}
        Generate a paragraph of approximately 200-400 words describing to the context.
    """
    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=['context']
    )

    chain = prompt | ollama_phi3_llm | StrOutputParser()
    
    return await chain.ainvoke({"context": context})

async def modelResponse(argument: str, user_id: str) -> str:
    user_collection = database["user"]
    context_collection = database["context_history"]

    result = await context_collection.find_one({"user_id": user_id})
    context = result.get("context", "") if result else ""
    context_summary = await get_context(context)

    template = """
        You are a professional debater. Your job is to argue AGAINST whatever the user says.
        No matter what they claim, challenge it with strong counter-arguments.
        Be direct, logical, and confident. Keep it to 3-4 sentences.

        Context for debate is {context_summary}
        
        User says: {argument}
        
        Counter-argument:
    """

    prompt = PromptTemplate(
        template=template,
        input_variables=['argument', 'context_summary']
    )

    chain = prompt | ollama_gemma2_llm | StrOutputParser()

    return await chain.ainvoke({"argument": argument, "context_summary": context_summary})

async def judge_debate(user_id: str):
    context_collection = database["context_history"]
    result = await context_collection.find_one({"user_id": user_id})

    context = result.get("context", "")

    template = """
        You are an impartial and strict debate judge with years of experience.
        You will be given a debate conversation between a User and an AI debater.
        
        Evaluate both sides based on:
        1. Logic & Reasoning - How well-structured are the arguments?
        2. Evidence & Facts - Are claims backed up?
        3. Persuasiveness - How convincing is each side?
        4. Clarity - How clear and concise are the points?

        Context:
        {context}

        Respond ONLY in this exact JSON format:
        {{
            "winner": "user" or "system",
            "user_score": <score out of 10>,
            "user_feedback": "<what the user did well and poorly>",
            "reasoning": "<2-3 sentences explaining why the winner won>"
        }}
    """

    prompt = PromptTemplate(
        template=template,
        input_variables=['context']
    )

    chain = prompt | ollama_phi3_llm | StrOutputParser()

    response = await chain.ainvoke({"context": context})
    response = re.sub(r"```json|```", "", response).strip()
    
    return json.loads(response)