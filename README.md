# DebateX — Multi-Agent LLM Reasoning Engine

> A high-performance, multi-agent AI system where specialized language models engage in adversarial debate, dynamically retrieve context, and produce structured, scored judgments.

---

## Overview

DebateX is a **FastAPI-based multi-agent reasoning system** that simulates structured debates between a user and AI agents. Unlike single-model chat systems, DebateX decomposes reasoning into **role-specific agents**, each optimized for a distinct cognitive function:

* **Topic Generation (fast inference)**
* **Adversarial Debate (context-aware reasoning)**
* **Judgment & Scoring (structured evaluation)**

The system integrates **Groq-hosted LLMs**, **vector-based context retrieval**, and **stateful debate memory** to produce coherent, multi-turn argumentation and objective adjudication.

---

## Core Architecture

```
User Argument
      │
      ▼
[Topic Generator]
(llama-3.1-8b-instant)
      │
      ▼
[Debate Engine]
(llama-3.3-70b-versatile + RAG context)
      │
      ▼
[Context Retrieval Layer]
(ChromaDB + MiniLM embeddings)
      │
      ▼
[Judge Agent]
(openai/gpt-oss-120b)
      │
      ▼
   Verdict
```

---

## Key Design Principles

### 1. Role-Specialized LLMs

Each model is assigned a **narrow cognitive responsibility**, improving performance and reducing reasoning drift:

* Fast model → generation
* Large model → reasoning
* Independent model → evaluation

---

### 2. Retrieval-Augmented Debate (RAG)

Debate context is:

* Chunked using `RecursiveCharacterTextSplitter`
* Embedded via `all-MiniLM-L6-v2`
* Retrieved dynamically using similarity search (`k=5`)

This ensures:

* Context relevance
* Reduced hallucination
* Better rebuttal quality

---

### 3. Stateful Multi-Turn Memory

* Full debate history stored in MongoDB
* Retrieved and compressed per turn
* Enables **coherent long-form argument chains**

---

## Features

* **JWT-secured API** — authentication and protected endpoints
* **Dynamic topic generation** — no static datasets
* **Adversarial debate engine** — always challenges user stance
* **RAG-based context injection** — improves argument quality
* **Multi-model orchestration (Groq)** — optimized per task
* **Async MongoDB storage** — scalable session persistence
* **Strict evaluation pipeline** — structured scoring + feedback

---

## Model Stack

| Role            | Model                     | Purpose                        |
| --------------- | ------------------------- | ------------------------------ |
| Topic Generator | `llama-3.1-8b-instant`    | Fast topic generation          |
| Debater         | `llama-3.3-70b-versatile` | High-quality counter-arguments |
| Judge           | `openai/gpt-oss-120b`     | Independent evaluation         |

---

## Tech Stack

| Layer         | Technology            |
| ------------- | --------------------- |
| Frontend      | Vue.js (Vue 3 + Vite) |
| Backend       | FastAPI + Uvicorn     |
| LLM Inference | Groq API              |
| Orchestration | LangChain Core        |
| Vector DB     | ChromaDB              |
| Embeddings    | HuggingFace MiniLM    |
| Database      | MongoDB (Motor async) |
| Auth          | JWT + Bcrypt          |

---

## Installation

### Prerequisites

Ensure the following are installed before proceeding:

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.10+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Bundled with Node.js |
| MongoDB | 6+ | [mongodb.com](https://www.mongodb.com) |

Verify your setup:

```bash
python --version
node --version
npm --version
```

---

### 1. Clone Repository

```bash
git clone https://github.com/aakashdandekar/DebateX-Multi-Agent-LLM-Reasoning-System.git
cd DebateX-Multi-Agent-LLM-Reasoning-System
```

### 2. Setup Environment

```bash
python -m venv .venv
source .venv/bin/activate
```

### 3. Install Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
```

> **Note:** `node_modules/` and `dist/` are excluded from the repository (listed in `.gitignore`). You must run `npm install` locally to restore dependencies.

```bash
# Check installed packages
npm list --depth=0

# Build for production (outputs to frontend/dist/)
npm run build
```

### 5. Configure Environment

```env
DATABASE_URL=mongodb://localhost:27017
DATABASE_NAME=debatex
SECRET_KEY=your_secret
GROQ_API_KEY=your_groq_key
```

### 6. Run Frontend Dev Server

```bash
cd frontend
npm run dev
```

Frontend: http://localhost:5173

---

### 7. Run Backend Server

```bash
cd backend
python main.py
```

Backend: http://localhost:8000

## API Endpoints

### Authentication

* `POST /register`
* `POST /login`

### Debate System

* `GET /get-topic`
* `POST /system/start-debate`
* `GET /system/debate/system-response`
* `GET /system/end-debate`

---

## Project Structure

```
DebateX/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── db/
│   ├── main.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── router/
│   │   ├── store/
│   │   └── main.js
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## Strategic Differentiation

DebateX is a **multi-agent reasoning system** with:

* Adversarial logic enforcement
* Context-aware retrieval
* Independent evaluation layer
* Structured outputs for downstream systems

This architecture aligns with **next-generation AI systems** where:

> reasoning is decomposed, not centralized.

---

## License

Apache License 2.0
