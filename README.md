# Debate-LLM

An intelligent, interactive AI Debating API built with **FastAPI**, **MongoDB**, and **Langchain**. This system allows users to engage in a structured debate against AI models, presenting arguments and receiving counter-arguments. Once the debate concludes, an AI judge evaluates the performance of both the user and the system, providing a final verdict, score, and constructive feedback.

## Features
- **User Authentication**: Secure user registration and login using JWT (JSON Web Tokens).
- **Interactive Debate**: Start a debate on any topic and receive dynamic counter-arguments.
- **Multi-LLM Support**: Integrates with multiple LLMs to power different parts of the debate:
  - **Ollama (gemma2:2b)** for generating counter-arguments against the user.
  - **Ollama (phi3)** for summarizing the context and acting as the final judge.
  - Setup available for **Google Gemini (gemini-2.0-flash-pro)** and **Groq (qwen3.5)**.
- **Context Awareness**: Maintains the history of the conversation to provide contextually relevant arguments.
- **Debate Evaluation**: Impartial AI judge evaluates the debate based on logic, reasoning, evidence, persuasiveness, and clarity to declare a winner.

## Tech Stack
- **Backend Framework**: FastAPI
- **Database**: MongoDB (via `motor` asynchronous driver)
- **AI / LLM Orchestration**: LangChain, Ollama, Google GenAI, Groq
- **Authentication**: Passlib (Bcrypt), Python-JOSE (JWT)
- **Server**: Uvicorn

## Prerequisites
Before you begin, ensure you have the following installed:
- Python 3.8+
- [MongoDB](https://www.mongodb.com/) (Running locally or a MongoDB Atlas URI)
- [Ollama](https://ollama.ai/) installed and running locally with the following models pulled:
  ```bash
  ollama run gemma2:2b
  ollama run phi3
  ```

## Installation

1. **Clone the repository** (or navigate to the project directory):
   ```bash
   cd Debate-LLM
   ```

2. **Create and activate a virtual environment** (optional but recommended):
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables Config**:
   Create a `.env` file in the root directory and add the following configuration:
   ```env
   # Database Configuration
   DATABASE_URL=mongodb://localhost:27017  # Or your MongoDB Atlas URI
   DATABASE_NAME=ai_debate_db
   ```
   *(Note: The JWT secret key might also need to be configured in `.env` based on `src/auth.py` implementation.)*

## Running the Application

Start the FastAPI application using Uvicorn:

```bash
python main.py
```
Or directly with uvicorn:
```bash
uvicorn src.app:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`. You can explore and test the API using the interactive Swagger UI at `http://localhost:8000/docs`.

## API Endpoints

### Authentication
- `POST /register`: Register a new user (`name`, `email`, `password`).
- `POST /login`: Authenticate as an existing user and receive an `access_token`.

### Debate Core
*(These endpoints require the `Authorization: Bearer <token>` header)*
- `POST /start-debate`: Initialize a new debate providing a `topic`.
- `GET /debate/system-response`: Submit your `user_response` (argument) and receive the AI's counter-argument.
- `GET /end-debate`: Conclude the debate. The AI judge evaluates the conversation and returns the winner, score, feedback, and reasoning.

## License
[Apache License 2.0](LICENSE)
