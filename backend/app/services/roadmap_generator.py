"""
SkillForge AI — Roadmap Generator Service (FR-05)

Generates week-by-week adaptive learning roadmaps targeting verified skill gaps.
- Primary: Google Gemini API with structured JSON output schema
- Fallback: Deterministic rule-based roadmap generator built from ranked gaps
- Validates output with Pydantic
"""

import json
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from app.config import settings

# Curated progressive learning modules for each skill gap
SKILL_TASK_MODULES = {
    "python": [
        ("Master Python data structures, iterators, and generators", 2.5),
        ("Understand Python OOP: dunder methods, inheritance, and dataclasses", 2.0),
        ("Asynchronous Python: asyncio event loop, coroutines, and tasks", 3.0),
        ("Package management, virtual environments, and Pytest suites", 2.5),
    ],
    "machine_learning": [
        ("Exploratory Data Analysis & Feature Engineering with Pandas & NumPy", 3.0),
        ("Supervised Learning: Linear/Logistic Regression, Decision Trees & Random Forests", 3.5),
        ("Unsupervised Learning: K-Means clustering and PCA dimensionality reduction", 2.5),
        ("Model Evaluation: Cross-validation, ROC-AUC, Precision/Recall trade-offs", 2.5),
    ],
    "llm_generative_ai": [
        ("Prompt Engineering fundamentals: Few-shot, Chain-of-Thought, System instructions", 2.0),
        ("Building with Gemini / OpenAI APIs: Structured outputs and JSON modes", 2.5),
        ("RAG Pipelines: Text chunking, embeddings, and vector database indexing", 4.0),
        ("Function calling and AI Agent tool execution loops", 3.5),
    ],
    "deep_learning": [
        ("Neural network fundamentals: Forward pass, backpropagation, and loss functions", 3.0),
        ("PyTorch basics: Tensors, autograd, and building custom nn.Module models", 3.5),
        ("Computer Vision & Convolutional Neural Networks (CNNs)", 3.5),
        ("Sequence Modeling & Transformer architecture overview", 4.0),
    ],
    "fastapi": [
        ("FastAPI fundamentals: Path & Query parameters with Pydantic validation", 2.0),
        ("Dependency Injection system and custom reusable dependencies", 2.5),
        ("Authentication & Security: OAuth2 Bearer tokens and JWT verification", 3.0),
        ("Database integration with Motor/AsyncIOMotorClient and error handlers", 3.5),
    ],
    "react": [
        ("Modern React: Components, JSX, and unidirectional data flow", 2.0),
        ("Mastering Hooks: useState, useEffect, useRef, and useCallback", 3.0),
        ("Global state management and React Context API", 2.5),
        ("Connecting React to REST APIs: Async fetching, loading & error states", 2.5),
    ],
    "javascript": [
        ("Modern ES6+ syntax: Destructuring, spread/rest, arrow functions, modules", 2.0),
        ("Asynchronous JavaScript: Event loop, Promises, and async/await", 2.5),
        ("DOM Manipulation, events, and modern browser APIs", 2.5),
        ("TypeScript fundamentals: Type annotations, interfaces, and generics", 3.0),
    ],
    "typescript": [
        ("TypeScript core types, interfaces, type aliases, and union types", 2.5),
        ("Generics, utility types (Partial, Pick, Omit), and type narrowing", 3.0),
        ("Configuring tsconfig.json and integrating TypeScript with React/Node", 2.5),
    ],
    "docker": [
        ("Docker essentials: Images, containers, daemon, and registries", 2.0),
        ("Writing production Dockerfiles: Multi-stage builds and layer caching", 3.0),
        ("Multi-container development using docker-compose.yml", 2.5),
        ("Networking, volumes, environment variables, and security", 2.5),
    ],
    "git": [
        ("Git branching strategies: Feature branches, rebasing vs merging", 2.0),
        ("Resolving complex merge conflicts and inspecting git log/reflog", 2.0),
        ("Writing GitHub Actions workflows for continuous integration (CI)", 2.5),
    ],
    "sql_databases": [
        ("Relational database design: Primary keys, Foreign keys, and Normalization", 2.5),
        ("Complex SQL queries: INNER/LEFT JOINs, subqueries, and aggregations", 3.0),
        ("Database performance: B-Tree Indexes, EXPLAIN execution plans", 3.0),
        ("ACID Transactions, isolation levels, and data integrity", 2.5),
    ],
    "mongodb": [
        ("Document modeling: Embedding vs referencing in MongoDB collections", 2.5),
        ("CRUD operations, update operators ($set, $push, $inc), and queries", 2.5),
        ("MongoDB Aggregation Pipeline: $match, $group, $lookup, $project", 3.5),
        ("Indexes and Atlas cloud cluster configuration", 2.0),
    ],
    "html_css": [
        ("Semantic HTML5 markup and accessibility best practices", 2.0),
        ("CSS Modern Layouts: Flexbox and CSS Grid deep dive", 2.5),
        ("Tailwind CSS utility-first styling and responsive mobile design", 3.0),
    ],
    "rest_apis": [
        ("REST architectural constraints, HTTP status codes, and idempotency", 2.0),
        ("API versioning, pagination, filtering, and sorting conventions", 2.5),
        ("OpenAPI / Swagger documentation and contract-first API design", 2.0),
    ],
}


class TaskItem(BaseModel):
    task_id: str
    title: str
    skill_id: str
    estimated_hours: float
    completed: bool = False
    completed_at: str | None = None


class WeekPlan(BaseModel):
    week_number: int
    theme: str
    summary: str
    target_skills: list[str]
    tasks: list[TaskItem]


class RoadmapData(BaseModel):
    career_id: str
    career_title: str
    weekly_hours: int = 10
    total_weeks: int
    generated_by: str  # "gemini" or "rule_based_fallback"
    created_at: str
    weeks: list[WeekPlan]


def generate_rule_based_roadmap(
    career_id: str,
    career_title: str,
    ranked_gaps: list[dict],
    weekly_hours: int = 10,
) -> RoadmapData:
    """
    Deterministic rule-based roadmap generator.
    Organizes the top skill gaps into 4-6 focused weekly milestones.
    """
    # Filter gaps that are missing or below target
    active_gaps = [g for g in ranked_gaps if g.get("severity") in ("missing", "below")]
    if not active_gaps:
        active_gaps = ranked_gaps[:4]  # If all mastered, review top 4 skills

    weeks = []
    week_idx = 1
    # Distribute top gaps across 4 to 6 weeks
    for gap in active_gaps[:6]:
        skill_id = gap["skill_id"]
        skill_name = gap["name"]
        shortfall = gap.get("shortfall", 50)

        # Get curated tasks for this skill
        task_templates = SKILL_TASK_MODULES.get(
            skill_id,
            [
                (f"Learn core principles and architecture of {skill_name}", 2.5),
                (f"Implement hands-on exercises and code samples with {skill_name}", 3.0),
                (f"Integrate {skill_name} into a portfolio mini-project", 3.5),
            ]
        )

        tasks = []
        for i, (title, hours) in enumerate(task_templates):
            tasks.append(
                TaskItem(
                    task_id=f"w{week_idx}-t{i+1}-{uuid.uuid4().hex[:6]}",
                    title=title,
                    skill_id=skill_id,
                    estimated_hours=hours,
                    completed=False,
                )
            )

        weeks.append(
            WeekPlan(
                week_number=week_idx,
                theme=f"Week {week_idx}: {skill_name} Mastery",
                summary=f"Focus on bridging your {shortfall}% shortfall in {skill_name} to meet {career_title} standards.",
                target_skills=[skill_id],
                tasks=tasks,
            )
        )
        week_idx += 1

    now_iso = datetime.now(timezone.utc).isoformat()
    return RoadmapData(
        career_id=career_id,
        career_title=career_title,
        weekly_hours=weekly_hours,
        total_weeks=len(weeks),
        generated_by="rule_based_fallback",
        created_at=now_iso,
        weeks=weeks,
    )


async def generate_gemini_roadmap(
    career_id: str,
    career_title: str,
    ranked_gaps: list[dict],
    weekly_hours: int = 10,
) -> RoadmapData:
    """
    Generate an AI roadmap using Google Gemini API with structured JSON output.
    Falls back gracefully to rule-based roadmap if key is missing or API errors.
    """
    if not settings.gemini_api_key:
        return generate_rule_based_roadmap(career_id, career_title, ranked_gaps, weekly_hours)

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)

        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.2,
            },
        )

        prompt = f"""You are SkillForge AI, an expert technical career mentor.
Create a personalized 4 to 6 week learning roadmap for a student targeting: {career_title} (Weekly time commitment: {weekly_hours} hours).

Here are their verified skill gaps (sorted by highest priority impact):
{json.dumps([{ 'skill': g['name'], 'skill_id': g['skill_id'], 'shortfall': g['shortfall'], 'severity': g['severity'] } for g in ranked_gaps[:6]], indent=2)}

Output ONLY valid JSON adhering strictly to this schema:
{{
  "weeks": [
    {{
      "week_number": 1,
      "theme": "Theme title for week 1",
      "summary": "1-2 sentence description of what will be learned and built",
      "target_skills": ["skill_id_1"],
      "tasks": [
        {{
          "title": "Actionable task description",
          "skill_id": "skill_id_1",
          "estimated_hours": 2.5
        }}
      ]
    }}
  ]
}}
"""
        response = await model.generate_content_async(prompt)
        parsed_json = json.loads(response.text)

        raw_weeks = parsed_json.get("weeks", [])
        weeks = []
        for w in raw_weeks:
            tasks = []
            w_num = w.get("week_number", len(weeks) + 1)
            for j, t in enumerate(w.get("tasks", [])):
                tasks.append(
                    TaskItem(
                        task_id=f"w{w_num}-t{j+1}-{uuid.uuid4().hex[:6]}",
                        title=t.get("title", "Practice task"),
                        skill_id=t.get("skill_id", "general"),
                        estimated_hours=float(t.get("estimated_hours", 2.0)),
                        completed=False,
                    )
                )
            weeks.append(
                WeekPlan(
                    week_number=w_num,
                    theme=w.get("theme", f"Week {w_num}"),
                    summary=w.get("summary", ""),
                    target_skills=w.get("target_skills", []),
                    tasks=tasks,
                )
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        return RoadmapData(
            career_id=career_id,
            career_title=career_title,
            weekly_hours=weekly_hours,
            total_weeks=len(weeks),
            generated_by="gemini",
            created_at=now_iso,
            weeks=weeks,
        )

    except Exception as e:
        print(f"Gemini API generation failed ({str(e)}), using rule-based fallback plan.")
        return generate_rule_based_roadmap(career_id, career_title, ranked_gaps, weekly_hours)
