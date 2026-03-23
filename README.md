# Debate-LLM

## Overview
Debate-LLM is an advanced, interactive artificial intelligence debating API developed using FastAPI, MongoDB, and LangChain. The system provides a platform for users to engage in structured, real-time debates against large language models (LLMs). Users can present arguments, receive logically coherent counter-arguments, and, upon concluding the debate, obtain a comprehensive evaluation from an impartial AI adjudicator. This evaluation encompasses a final verdict, quantitative scoring, and detailed, constructive feedback.

## Key Features
- **Secure Authentication**: Robust user registration and session management implemented via JSON Web Tokens (JWT).
- **Interactive Argumentation**: Facilities for initializing debates on arbitrary topics with dynamic generation of counter-arguments.
- **Microservice LLM Architecture**: Utilizes specialized local models for distinct structural roles within the debate framework:
  - *Topic Generation*: Deploys **Ollama (tinyllama)** for dynamic creation of diverse debate topics.
  - *Argument Generation*: Employs **Ollama (gemma2:2b)** to formulate and articulate counter-arguments in response to user propositions.
  - *Adjudication and Summarization*: Utilizes **Ollama (phi3)** to maintain conversational context and serve as the final judicial entity.
- **Contextual Awareness**: Systematically records and analyzes conversation history to ensure the issuance of contextually pertinent arguments.
- **Comprehensive Evaluation**: Concludes debates with a diagnostic review based on predefined criteria, including logical rigor, factual evidence, persuasiveness, and semantic clarity, to impartially declare a winner.

## Architecture and Technology Stack
- **Application Framework**: FastAPI
- **Database Subsystem**: MongoDB (integrated via the `motor` asynchronous engine)
- **Model Orchestration**: LangChain Core, Ollama 
- **Security Infrastructure**: Passlib (Bcrypt hashing), Python-JOSE (JWT implementation)
- **Application Server**: Uvicorn

## System Prerequisites
Prior to deployment, ensure the host environment satisfies the following dependencies:
- Python 3.8 or higher
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)
- [Ollama](https://ollama.com/) functioning locally, provisioned with the necessary models:
  ```bash
  ollama run gemma2:2b
  ollama run phi3
  ollama run tinyllama
  ```

## Installation Instructions

1. **Repository Cloning**:
   Navigate to your preferred directory and clone the repository:
   ```bash
   git clone <your-repo-url>
   cd AI_Debate_System
   ```

2. **Environment Initialization** (Recommended):
   Establish and activate an isolated Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Implementation on Windows: .venv\Scripts\activate
   ```

3. **Dependency Resolution**:
   Install the requisite Python packages as defined in the project configuration:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**:
   Create a standard `.env` file within the system's root directory and append the necessary configuration parameters:
   ```env
   # Database Connection Parameters
   DATABASE_URL=mongodb://localhost:27017  # Alternatively, supply your MongoDB Atlas URI
   DATABASE_NAME=ai_debate_db
   
   # Security Specifications
   SECRET_KEY=your_secure_jwt_secret_key
   ```

## Execution Protocol

Initiate the FastAPI application utilizing the Uvicorn ASGI server:

```bash
python main.py
```
Alternatively, execute the server directly:
```bash
uvicorn src.app:app --host 0.0.0.0 --port 8000 --reload
```

The application programming interface (API) will subsequently be accessible at `http://localhost:8000`. Comprehensive API documentation and interactive testing facilities are automatically generated and available at `http://localhost:8000/docs`.

## Application Programming Interface (API) Reference

### Authentication Endpoints
- `POST /register`: Registers a novel user entity (requires `name`, `email`, `password`).
- `POST /login`: Authenticates an existing user and provisions an ephemeral `access_token`.

### Debate Operations
*(Note: Exertion of the following endpoints mandates a valid `Authorization: Bearer <token>` header)*
- `GET /get-topic`: Yields a single-line generated topic for the debate.
- `POST /system/start-debate`: Initializes a new debate context predicated on the provided `topic` and `role`.
- `GET /system/debate/system-response`: Submits a `user_response` (argument) and retrieves the generated counter-argument.
- `GET /system/end-debate`: Terminates the current debate. The AI adjudicator processes the discourse and emits a structured assessment delineating the victor, score, rationale, and feedback.

## License
This project is licensed under the [Apache License 2.0](LICENSE).
