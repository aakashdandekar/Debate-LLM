import re
import os
import json
from src.db import database
from langchain_core.prompts import PromptTemplate
from bson import ObjectId
from src.schemas import Context_history
from langchain_ollama import OllamaLLM
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_API_KEY", "localhost:11434")

ollama_gemma2_llm = OllamaLLM(model="gemma2:2b", base=OLLAMA_BASE_URL)
ollama_phi3_llm = OllamaLLM(model="phi3", base=OLLAMA_BASE_URL)
ollama_tinyllama_llm = OllamaLLM(model="tinyllama", base=OLLAMA_BASE_URL)

splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=150,
    separators=["\n\n", "\n", ".", " "]
)

embedding_model = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2"
)

async def find_topic(template: str):
    prompt = PromptTemplate(
        template=template
    )

    chain = prompt | ollama_tinyllama_llm | StrOutputParser()

    return await chain.ainvoke({})

async def modelResponse(argument: str, user_id: str) -> str:
    user_collection = database["user"]
    context_collection = database["context_history"]

    result = await context_collection.find_one({"user_id": user_id})
    context = result.get("context", "") if result else ""

    topic = result.get("topic", "")
    role = result.get("role", "")

    role = "for" if role == "against" else "against"

    docs = splitter.create_documents([context]) if context else []
    if docs:
        vectorstore = Chroma.from_documents(
            documents=docs,
            embedding=embedding_model
        )

        retriever = vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )
        retrieved_docs = retriever.invoke(argument)
            
        context_summary = "\n\n".join([d.page_content for d in retrieved_docs])
    else:
        context_summary = ""


    template = """
        Topic: {topic}
        Your Role: {role}
        You are a professional debater. Your job is to argue AGAINST whatever the user says.
        No matter what they claim, challenge it with strong counter-arguments.
        Be direct, logical, and confident. Keep it to 3-4 sentences.

        Context for debate is {context_summary}
        
        User says: {argument}
        
        Counter-argument:
    """

    prompt = PromptTemplate(
        template=template,
        input_variables=['role', 'topic', 'argument', 'context_summary']
    )

    chain = prompt | ollama_gemma2_llm | StrOutputParser()
    response = await chain.ainvoke({"role": role, "topic": topic, "argument": argument, "context_summary": context_summary})

    vectorstore.delete_collection()

    return response

async def judge_debate(user_id: str):
    context_collection = database["context_history"]
    result = await context_collection.find_one({"user_id": user_id})

    if not result:
        raise ValueError(f"No debate session found for user_id: {user_id}")

    topic = result.get("active_debate", "")
    context = result.get("context", "")

    template = """
        You are a strict debate judge with years of experience.
        You can favor user over system, System score and user score is very similar.
        You will be given a debate conversation between a User and an AI debater.
        
        Evaluate both sides based on:
        1. Logic & Reasoning - How well-structured are the arguments?
        2. Evidence & Facts - Are claims backed up?
        3. Persuasiveness - How convincing is each side?
        4. Clarity - How clear and concise are the points?

        Topic of Debate:
        {topic}

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
        input_variables=['topic', 'context']
    )

    docs = splitter.create_documents([context]) if context else []
    if docs:
        vectorstore = Chroma.from_documents(
            documents=docs,
            embedding=embedding_model
        )

        retriever = vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )
        retrieved_docs = retriever.invoke(topic)

        context = "\n\n".join([d.page_content for d in retrieved_docs])
    else:
        context = ""

    chain = prompt | ollama_phi3_llm | StrOutputParser()

    response = await chain.ainvoke({"topic": topic, "context": context})
    response = re.sub(r"```json|```", "", response).strip()

    vectorstore.delete_collection()
    
    return json.loads(response)
