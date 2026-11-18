"""
SkillForge AI — Grounded & Wide AI Mentor Service (FR-09)

Powered by Google Gemini API for deep, wide, and grounded technical mentorship:
- Handles open-ended technical questions: programming concepts, code explanations,
  system architectures, debugging, algorithms, and career prep.
- Automatically contextualizes with verified learner data when asking about skills/gaps.
- Robust multi-model support (gemini-1.5-flash, gemini-2.0-flash, gemini-1.5-pro).
- Extensive structured offline fallback engine when API keys are not provided.
"""

import json
from datetime import datetime, timezone
from app.config import settings

MENTOR_SYSTEM_INSTRUCTION = (
    "You are SkillForge AI Mentor, an elite, practical, and highly supportive technical engineering mentor powered by Google AI.\n\n"
    "Your mission is to help software engineers and AI learners master real skills, understand complex technologies, "
    "and advance their careers with verified proof.\n\n"
    "CAPABILITIES & INSTRUCTIONS:\n"
    "1. WIDE TECHNICAL QUESTIONS:\n"
    "   You can answer ANY question across computer science and software development, including:\n"
    "   - System design, microservices, APIs, database schema design (SQL, NoSQL, indexing, ACID)\n"
    "   - Modern programming languages (Python, JavaScript, TypeScript, Go, Rust, Java, C++)\n"
    "   - Web & backend frameworks (FastAPI, React, Next.js, Node.js, Express, Django)\n"
    "   - Artificial Intelligence, Machine Learning, Deep Learning, LLMs, RAG, PyTorch, Transformers\n"
    "   - DevOps, Docker, Kubernetes, CI/CD, Linux, cloud architectures (GCP, AWS)\n"
    "   - Algorithms, data structures, LeetCode / coding interview problem solving, code reviews\n"
    "   Provide thorough, clean explanations with practical code snippets, best practices, and real-world trade-offs.\n\n"
    "2. PERSONALIZED LEARNER GROUNDING:\n"
    "   When the learner's query relates to their own skills, gaps, readiness, roadmap, or next steps, "
    "   reference their verified profile provided in the context.\n"
    "   Encourage them to build hands-on projects and push commits to GitHub to turn theoretical knowledge into verified code activity.\n\n"
    "3. FORMATTING & TONE:\n"
    "   - Professional, encouraging, clear, and direct (no fluff or boilerplate apologies).\n"
    "   - Use GitHub-flavored markdown with bold headers, bullet lists, and syntax-highlighted code blocks (```python, ```javascript, etc.).\n"
    "   - When explaining code, explain the 'why' behind design choices.\n"
)


def build_learner_context(
    user_doc: dict | None,
    scores_list: list[dict],
    gap_report: dict,
    roadmap_doc: dict | None,
) -> str:
    """Build a compact prompt context containing verified learner facts."""
    career_title = gap_report.get("career_title", "Software Engineer")
    match_pct = gap_report.get("match_percentage", 0)

    # Top skills (up to 5)
    top_skills = [
        f"{s.get('name')}: {s.get('score')}% ({s.get('confidence')} confidence)"
        for s in scores_list[:5]
    ]

    # Top gaps (up to 4)
    top_gaps = [
        f"{g.get('name')} (Needs +{g.get('shortfall')}%, severity: {g.get('severity')})"
        for g in gap_report.get("gaps", [])[:4]
    ]

    # Current roadmap status
    current_week_theme = "Not started"
    next_task = "Generate roadmap"
    if roadmap_doc and "weeks" in roadmap_doc and len(roadmap_doc["weeks"]) > 0:
        for w in roadmap_doc["weeks"]:
            uncompleted = [t for t in w.get("tasks", []) if not t.get("completed")]
            if uncompleted:
                current_week_theme = w.get("theme", "")
                next_task = uncompleted[0].get("title", "")
                break
        if current_week_theme == "Not started":
            current_week_theme = roadmap_doc["weeks"][0].get("theme", "")

    return f"""=== VERIFIED LEARNER CONTEXT ===
- Target Career: {career_title} ({match_pct}% match readiness)
- Verified Skills from GitHub: {', '.join(top_skills) if top_skills else 'No public repos analyzed yet'}
- Top Priority Gaps: {', '.join(top_gaps) if top_gaps else 'None'}
- Active Roadmap Milestone: {current_week_theme}
- Next Roadmap Action: {next_task}
================================="""


def generate_fallback_mentor_reply(user_message: str, context_str: str, gap_report: dict) -> str:
    """
    Intelligent knowledge-base fallback response used when Google Gemini API key
    is not configured or when network is offline.
    """
    msg = user_message.lower().strip()
    career = gap_report.get("career_title", "your chosen career")
    gaps = gap_report.get("gaps", [])
    top_gap = gaps[0] if gaps else None

    # 1. FastAPI
    if "fastapi" in msg:
        return (
            "### ⚡ Mastering FastAPI\n\n"
            "FastAPI is a modern, high-performance web framework for building APIs with Python based on standard Python type hints.\n\n"
            "**Key Architectural Advantages:**\n"
            "- **High Performance:** On par with NodeJS and Go (powered by Starlette and Uvicorn).\n"
            "- **Automatic Data Validation:** Powered by Pydantic v2.\n"
            "- **Interactive Swagger Docs:** Automatically served at `/docs`.\n"
            "- **Dependency Injection:** Modular, testable services using `Depends()`.\n\n"
            "```python\n"
            "from fastapi import FastAPI, Depends, HTTPException\n"
            "from pydantic import BaseModel\n\n"
            "app = FastAPI()\n\n"
            "class Item(BaseModel):\n"
            "    name: str\n"
            "    price: float\n\n"
            "@app.post('/items')\n"
            "async def create_item(item: Item):\n"
            "    return {'message': f'Created {item.name}', 'price': item.price}\n"
            "```\n\n"
            "💡 *Tip: Add your Google Gemini API key to ask open-ended questions about FastAPI architecture!*"
        )

    # 2. Docker / Containers
    if "docker" in msg or "container" in msg:
        return (
            "### 🐳 Docker & Containerization Essentials\n\n"
            "Docker packages an application and its dependencies into a standardized unit called a **container**.\n\n"
            "**Core Concepts:**\n"
            "- **Dockerfile:** Recipe for building an immutable image.\n"
            "- **Image:** Read-only template with runtime, libraries, and code.\n"
            "- **Container:** Running instance of an image in isolated user space.\n"
            "- **Volume:** Persistent data storage decoupled from container lifecycle.\n\n"
            "```dockerfile\n"
            "# Production Python Dockerfile\n"
            "FROM python:3.12-slim\n"
            "WORKDIR /app\n"
            "COPY requirements.txt .\n"
            "RUN pip install --no-cache-dir -r requirements.txt\n"
            "COPY . .\n"
            "CMD [\"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]\n"
            "```\n\n"
            "💡 *Tip: Add your Google Gemini API key to ask in-depth questions about multi-stage builds or Kubernetes orchestration!*"
        )

    # 3. Python concepts (async, generators, decorators)
    if "async" in msg or "gil" in msg or "python" in msg and any(k in msg for k in ("how", "what", "explain", "work")):
        return (
            "### 🐍 Python Asynchronous Programming & Concurrency\n\n"
            "Python's `asyncio` allows writing concurrent code using the `async`/`await` syntax, ideal for I/O-bound tasks (database queries, network requests, file reading).\n\n"
            "**Key Differences:**\n"
            "- **Synchronous:** Blocks the thread until the operation finishes.\n"
            "- **Asynchronous:** Releases execution to the event loop while waiting for I/O, allowing other requests to be processed.\n\n"
            "```python\n"
            "import asyncio\n"
            "import httpx\n\n"
            "async def fetch_user(user_id: int):\n"
            "    async with httpx.AsyncClient() as client:\n"
            "        response = await client.get(f'https://api.example.com/users/{user_id}')\n"
            "        return response.json()\n\n"
            "async def main():\n"
            "    # Run multiple requests concurrently\n"
            "    users = await asyncio.gather(fetch_user(1), fetch_user(2), fetch_user(3))\n"
            "    print(users)\n"
            "```\n\n"
            "💡 *Tip: Add your Google Gemini API key to get tailored coding solutions for any Python problem!*"
        )

    # 4. Machine Learning & Deep Learning
    if any(k in msg for k in ("machine learning", "deep learning", "pytorch", "model", "training", "rag", "llm")):
        return (
            "### 🤖 Machine Learning & AI Engineering Fundamentals\n\n"
            "Building modern AI applications typically spans three paradigms:\n\n"
            "1. **Traditional ML (Scikit-Learn):** Tabular data, classification/regression (Random Forest, XGBoost). Focus on feature engineering.\n"
            "2. **Deep Learning (PyTorch):** Neural networks, computer vision, and NLP with custom architectures, loss functions, and GPU tensors.\n"
            "3. **Generative AI & RAG (Retrieval-Augmented Generation):** Connecting LLMs (e.g. Gemini) to external vector databases (Pinecone, Chroma, Qdrant) using semantic embeddings.\n\n"
            "**Typical RAG Pipeline:**\n"
            "`Documents -> Chunking -> Vector Embeddings -> Vector Store -> Query Semantic Search -> Grounded LLM Response`\n\n"
            "💡 *Tip: Add your Google Gemini API key for dynamic architecture designs, loss function explanations, and custom PyTorch code!*"
        )

    # 5. Database & SQL
    if any(k in msg for k in ("database", "sql", "postgres", "mongodb", "indexing", "acid")):
        return (
            "### 🗄️ Database Architecture & Performance Tuning\n\n"
            "Choosing and scaling databases comes down to query patterns and data structure:\n\n"
            "- **Relational (PostgreSQL, MySQL):** Strict schemas, ACID guarantees, complex joins. Perfect for transactions, user auth, and financial data.\n"
            "- **Document / NoSQL (MongoDB):** Flexible JSON-like schemas, horizontal sharding, rapid prototyping. Great for catalogs, event logging, and unstructured metadata.\n"
            "- **B-Tree Indexing:** Accelerates `WHERE`, `ORDER BY`, and `JOIN` operations from $O(N)$ full table scans down to $O(\\log N)$.\n\n"
            "💡 *Tip: Connect Google Gemini API to ask specific SQL query optimization and schema design questions!*"
        )

    # 6. Interview Preparation
    if any(k in msg for k in ("interview", "prep", "question", "job", "career")):
        return (
            f"### 🎯 Technical Interview Preparation for {career}\n\n"
            "Top tier engineering interviews evaluate four pillars:\n\n"
            "1. **Data Structures & Algorithms:** Arrays, Hash Maps, Two Pointers, Trees, Graphs, and Dynamic Programming.\n"
            "2. **System Design:** Scalability, load balancing, caching (Redis), database sharding, and rate limiting.\n"
            "3. **Domain Depth:** In-depth knowledge of your primary stack (e.g., Python internals, async event loops, container orchestration).\n"
            "4. **Behavioral (STAR Method):** Situation, Task, Action, Result. Focus on leadership and trade-offs.\n\n"
            f"💡 **Your Immediate Priority:** Your #1 skill gap is **{top_gap['name'] if top_gap else 'Git & System Architecture'}**. "
            "Building portfolio projects that demonstrate this will give you concrete talking points for interview defense."
        )

    # 7. Learner Roadmap & Focus
    if any(k in msg for k in ("what should i", "focus", "today", "next", "start")):
        if top_gap:
            return (
                f"### 🎯 Strategic Next Step for {career}\n\n"
                f"Based on your verified GitHub activity, your highest-leverage gap is **{top_gap['name']}** "
                f"(current shortfall: **+{top_gap['shortfall']}%**).\n\n"
                f"**Action Plan:**\n"
                f"1. Open your **AI Roadmap** tab and complete the next milestone task.\n"
                f"2. Push at least 2–3 commits to a public GitHub repo demonstrating {top_gap['name']}.\n"
                f"3. Run **Re-scan GitHub** to convert your progress into verified skill score growth!"
            )
        return "You are in great shape! Keep progressing through your active roadmap milestones and pushing verified commits to GitHub."

    # 8. General open-ended query fallback
    return (
        f"### 🤖 SkillForge AI Mentor\n\n"
        f"I am tracking your learning path toward **{career}**.\n\n"
        f"I can help you with:\n"
        f"- ⚡ **In-Depth Code Explanations:** FastAPI, React, Docker, Python, PyTorch, SQL, and Git.\n"
        f"- 🎯 **Skill Gap Analysis:** Targeted advice on bridging your largest shortfalls.\n"
        f"- 💻 **System Design & Architectures:** Designing scalable backends and APIs.\n"
        f"- 📄 **Interview Defense:** How to defend your GitHub projects to recruiters.\n\n"
        f"*(💡 Pro-Tip: Add your free Google Gemini API key to ask open-ended, wide-ranging coding and architecture questions!)*"
    )


async def get_mentor_response(
    user_message: str,
    context_str: str,
    conversation_history: list[dict],
    gap_report: dict,
    api_key: str | None = None,
) -> str:
    """
    Generate an intelligent mentor response via Google Gemini API
    or rich knowledge-base fallback.
    """
    effective_key = api_key or settings.gemini_api_key

    if not effective_key:
        return generate_fallback_mentor_reply(user_message, context_str, gap_report)

    # Available models in priority order
    candidate_models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]

    try:
        import google.generativeai as genai
        genai.configure(api_key=effective_key)

        last_error = None
        for model_name in candidate_models:
            try:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=MENTOR_SYSTEM_INSTRUCTION,
                )

                # Format conversation history
                chat_history = []
                for m in conversation_history[-8:]:
                    role = "user" if m.get("role") == "user" else "model"
                    chat_history.append({"role": role, "parts": [m.get("content", "")]})

                chat = model.start_chat(history=chat_history)
                full_prompt = f"{context_str}\n\nLearner Question: {user_message}"
                response = await chat.send_message_async(full_prompt)
                if response and response.text:
                    return response.text
            except Exception as model_err:
                last_error = model_err
                continue

        if last_error:
            print(f"Gemini API model attempt failed ({str(last_error)}), falling back.")
            return generate_fallback_mentor_reply(user_message, context_str, gap_report)

    except Exception as e:
        print(f"Gemini mentor chat exception ({str(e)}), using knowledge fallback.")
        return generate_fallback_mentor_reply(user_message, context_str, gap_report)

    return generate_fallback_mentor_reply(user_message, context_str, gap_report)
