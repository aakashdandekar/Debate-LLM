# DebateX — Multi-Agent LLM Reasoning System

> A structured AI debating platform where multiple specialized language models argue, counter, and judge — so you can sharpen your thinking against a formidable opponent.

---

## What is DebateX?

DebateX is a **FastAPI-powered debating API** that pits you against a panel of local LLMs in a structured, multi-turn debate. You pick a topic, take a position, and argue your case — the system fires back with coherent counter-arguments. When the debate ends, an independent AI adjudicator scores the entire exchange and declares a winner with detailed feedback.

The key design insight is **role-specialized models**: rather than using one LLM for everything, DebateX delegates distinct cognitive tasks to different Ollama models, each tuned to the demands of that role.

---

## How It Works

```
User submits argument
        │
        ▼
 [gemma2:2b] ──► generates counter-argument (tracks full conversation history)
        │
        ▼
 (debate continues turn-by-turn)
        │
        ▼
  User ends debate
        │
        ▼
   [phi3] ──► adjudicates: scores logic, evidence, persuasion, clarity → declares winner
```

Topic suggestions are generated on-demand by `tinyllama`, keeping the debate fresh without hardcoded lists.

---

## Features

- **JWT Authentication** — register, login, and get a bearer token; all debate endpoints are protected
- **Dynamic Topic Generation** — `GET /get-topic` uses `tinyllama` to surface a fresh debate topic on demand
- **Stateful Multi-Turn Debate** — full conversation history is maintained across turns for contextually coherent counter-arguments
- **Specialized Agent Architecture** — three distinct Ollama models handle three distinct roles (see below)
- **AI Adjudication** — on debate end, `phi3` evaluates the full transcript across four criteria and returns a structured verdict
- **Async MongoDB Storage** — user accounts and debate sessions persisted via Motor (async MongoDB driver)
- **Auto-generated API Docs** — interactive Swagger UI available at `/docs` out of the box

---

## Agent Roles

| Agent | Model | Role |
|---|---|---|
| Topic Generator | `tinyllama` | Generates diverse, one-line debate topics on demand |
| Debater | `gemma2:2b` | Formulates counter-arguments grounded in the conversation history |
| Adjudicator | `phi3` | Evaluates the full debate and issues a scored verdict |

---

## Tech Stack

| Layer | Technology |
|---|---|
| API Framework | FastAPI + Uvicorn |
| LLM Orchestration | LangChain Core + LangChain Ollama |
| Local Models | Ollama (`tinyllama`, `gemma2:2b`, `phi3`) |
| Database | MongoDB via Motor (async) |
| Auth | JWT (python-jose) + Bcrypt (passlib) |
| Templates / Frontend | Jinja2 + HTML/CSS/JS |

---

## Prerequisites

- Python 3.8+
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas URI
- [Ollama](https://ollama.com/) installed and running, with the three required models pulled:

```bash
ollama pull tinyllama
ollama pull gemma2:2b
ollama pull phi3
```

---

## Getting Started

**1. Clone the repository**

```bash
git clone https://github.com/aakashdandekar/DebateX-Multi-Agent-LLM-Reasoning-System.git
cd DebateX-Multi-Agent-LLM-Reasoning-System
```

**2. Create and activate a virtual environment**

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
```

**3. Install dependencies**

```bash
pip install -r requirements.txt
```

**4. Configure environment variables**

Create a `.env` file in the project root:

```env
DATABASE_URL=mongodb://localhost:27017
DATABASE_NAME=debatex
SECRET_KEY=your_secure_jwt_secret_key
```

**5. Start the server**

```bash
python main.py
```

The API will be live at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create a new user account (`name`, `email`, `password`) |
| POST | `/login` | Authenticate and receive an `access_token` |

### Debate

> All debate endpoints require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/get-topic` | Get an AI-generated debate topic |
| POST | `/system/start-debate` | Start a new debate session (`topic`, `role`) |
| GET | `/system/debate/system-response` | Submit your argument (`user_response`) and get a counter-argument |
| GET | `/system/end-debate` | End the debate and receive the adjudicator's full verdict |

---

## Project Structure

```
DebateX/
├── src/                  # Core application (routes, models, services)
├── static/               # CSS / JS assets
├── templates/            # Jinja2 HTML templates
├── main.py               # Entry point — launches Uvicorn
├── requirements.txt      # Python dependencies
└── .env                  # Local config (not committed)
```

---

## License

Licensed under the [Apache License 2.0](LICENSE).
