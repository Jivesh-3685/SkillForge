"""
SkillForge AI — Skill Scoring & Assessment Routes (FR-03)

- GET  /api/skills/scores         -> Return per-technology skill scores
- GET  /api/skills/quiz/questions -> Return 10-question cold-start quiz
- POST /api/skills/quiz           -> Submit cold-start quiz to seed scores
"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.database import get_db
from app.services.skill_analyzer import SkillAnalyzer, FORMULA_VERSION

router = APIRouter(prefix="/api/skills", tags=["Skills"])
analyzer = SkillAnalyzer()

COLD_START_QUESTIONS = [
    {
        "id": "q1",
        "skill_id": "python",
        "question": "How comfortable are you with Python?",
        "options": [
            {"label": "Never used it", "value": 0},
            {"label": "Basic scripts & syntax", "value": 30},
            {"label": "Build packages, OOP, async", "value": 60},
            {"label": "Production systems & internals", "value": 85},
        ],
    },
    {
        "id": "q2",
        "skill_id": "javascript",
        "question": "What is your experience with JavaScript/TypeScript?",
        "options": [
            {"label": "None", "value": 0},
            {"label": "DOM manipulation & basics", "value": 30},
            {"label": "Modern ES6+, async/await, APIs", "value": 60},
            {"label": "Full-stack apps, TypeScript types", "value": 85},
        ],
    },
    {
        "id": "q3",
        "skill_id": "react",
        "question": "How do you rate your React skills?",
        "options": [
            {"label": "Never used React", "value": 0},
            {"label": "Basic components & props", "value": 30},
            {"label": "Hooks, Context, State management", "value": 65},
            {"label": "Performance tuning, Next.js, SSR", "value": 85},
        ],
    },
    {
        "id": "q4",
        "skill_id": "fastapi",
        "question": "Experience with building backend REST APIs?",
        "options": [
            {"label": "Never built an API", "value": 0},
            {"label": "Simple CRUD routes", "value": 35},
            {"label": "Authentication, CORS, async DB queries", "value": 65},
            {"label": "Microservices, caching, OpenAPI specs", "value": 85},
        ],
    },
    {
        "id": "q5",
        "skill_id": "sql_databases",
        "question": "Database querying and modeling knowledge?",
        "options": [
            {"label": "No database experience", "value": 0},
            {"label": "Basic SELECT, INSERT, WHERE", "value": 30},
            {"label": "JOINs, indexing, schema design", "value": 65},
            {"label": "Query optimization, transactions, ACID", "value": 85},
        ],
    },
    {
        "id": "q6",
        "skill_id": "git",
        "question": "How comfortable are you with Git & GitHub?",
        "options": [
            {"label": "Unfamiliar with git", "value": 0},
            {"label": "git add, commit, push", "value": 35},
            {"label": "Branching, PRs, merge conflicts", "value": 70},
            {"label": "Rebase, git hooks, CI/CD Actions", "value": 90},
        ],
    },
    {
        "id": "q7",
        "skill_id": "docker",
        "question": "Containerization with Docker?",
        "options": [
            {"label": "Never used Docker", "value": 0},
            {"label": "Can run pre-built containers", "value": 30},
            {"label": "Write Dockerfile & docker-compose.yml", "value": 65},
            {"label": "Multi-stage builds, orchestration", "value": 85},
        ],
    },
    {
        "id": "q8",
        "skill_id": "machine_learning",
        "question": "Machine Learning fundamentals?",
        "options": [
            {"label": "No ML knowledge", "value": 0},
            {"label": "Basic data analysis with pandas", "value": 35},
            {"label": "Scikit-learn models (regression, classification)", "value": 65},
            {"label": "Feature engineering, cross-validation, metrics", "value": 85},
        ],
    },
    {
        "id": "q9",
        "skill_id": "llm_generative_ai",
        "question": "Working with LLMs & Generative AI APIs?",
        "options": [
            {"label": "Used ChatGPT as a user only", "value": 10},
            {"label": "Called OpenAI/Gemini APIs with simple prompts", "value": 40},
            {"label": "Structured outputs, function calling, RAG", "value": 70},
            {"label": "Fine-tuning, agents, vector databases", "value": 90},
        ],
    },
    {
        "id": "q10",
        "skill_id": "html_css",
        "question": "Styling & responsive web design?",
        "options": [
            {"label": "No frontend styling knowledge", "value": 0},
            {"label": "Basic HTML tags and CSS colors", "value": 30},
            {"label": "Flexbox, Grid, Tailwind CSS", "value": 70},
            {"label": "Animations, accessible UI, custom design systems", "value": 90},
        ],
    },
]


class QuizSubmission(BaseModel):
    answers: dict[str, int] = Field(
        ...,
        description="Mapping of question id (or skill_id) to chosen score value (0-100)",
    )


@router.get("/scores")
async def get_skill_scores(user: dict = Depends(get_current_user)):
    """
    Compute and return deterministic skill scores based on the user's
    latest GitHub scan. Returns empty list if no GitHub account is connected.
    """
    db = get_db()
    uid = user["uid"]

    # 1. Fetch GitHub scan data
    analysis_doc = await db["github_analysis"].find_one({"firebase_uid": uid})
    scan_data = analysis_doc.get("data") if analysis_doc else None

    # If no GitHub data, check if quiz scores exist
    if not scan_data:
        quiz_scores_doc = await db["skill_scores"].find_one(
            {"firebase_uid": uid, "source": "quiz"},
            sort=[("calculated_at", -1)],
        )
        if quiz_scores_doc:
            return {
                "source": "quiz",
                "is_cold_start": True,
                "formula_version": "quiz-v1.0",
                "calculated_at": quiz_scores_doc.get("calculated_at"),
                "scores": quiz_scores_doc.get("scores", []),
                "notice": "Scores seeded from self-assessment quiz (low confidence). Connect GitHub to verify.",
            }
        return {
            "source": "none",
            "is_cold_start": True,
            "formula_version": FORMULA_VERSION,
            "scores": [],
            "notice": "No GitHub data or quiz completed yet.",
        }

    # 2. Compute scores deterministically
    analysis_result = analyzer.analyze(scan_data)
    scan_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # 3. Store in append-only scans collection
    await db["scans"].insert_one({
        "scan_id": scan_id,
        "firebase_uid": uid,
        "formula_version": FORMULA_VERSION,
        "created_at": now,
        "is_cold_start": analysis_result["is_cold_start"],
        "repo_count": analysis_result["total_profile_repos"],
        "total_commits": analysis_result["total_profile_commits"],
    })

    # 4. Upsert into skill_scores collection
    await db["skill_scores"].update_one(
        {"firebase_uid": uid},
        {
            "$set": {
                "scan_id": scan_id,
                "firebase_uid": uid,
                "source": "github",
                "formula_version": FORMULA_VERSION,
                "calculated_at": now.isoformat(),
                "is_cold_start": analysis_result["is_cold_start"],
                "scores": analysis_result["scores"],
            }
        },
        upsert=True,
    )

    return {
        "source": "github",
        "scan_id": scan_id,
        "formula_version": FORMULA_VERSION,
        "calculated_at": now.isoformat(),
        "is_cold_start": analysis_result["is_cold_start"],
        "total_profile_repos": analysis_result["total_profile_repos"],
        "total_profile_commits": analysis_result["total_profile_commits"],
        "scores": analysis_result["scores"],
    }


@router.get("/quiz/questions")
async def get_quiz_questions(user: dict = Depends(get_current_user)):
    """Return the 10-question self-assessment for cold-start profiles."""
    return {"questions": COLD_START_QUESTIONS}


@router.post("/quiz")
async def submit_quiz(submission: QuizSubmission, user: dict = Depends(get_current_user)):
    """
    Process quiz answers to seed low-confidence skill scores for cold-start learners.
    """
    db = get_db()
    uid = user["uid"]
    taxonomy = analyzer.taxonomy
    taxonomy_map = {s["id"]: s for s in taxonomy}

    scored_skills = []
    # Map answers to taxonomy
    for q in COLD_START_QUESTIONS:
        q_id = q["id"]
        skill_id = q["skill_id"]
        if q_id in submission.answers or skill_id in submission.answers:
            val = submission.answers.get(q_id) if q_id in submission.answers else submission.answers.get(skill_id)
            skill_info = taxonomy_map.get(skill_id, {})
            if val is not None and val > 0:
                scored_skills.append({
                    "skill_id": skill_id,
                    "name": skill_info.get("name", skill_id.title()),
                    "category": skill_info.get("category", "General"),
                    "score": int(val),
                    "confidence": "low",
                    "metrics": {
                        "volume": 0.0,
                        "breadth": 0.0,
                        "activity": 0.0,
                        "recency": 1.0,
                        "repos_count": 0,
                        "commits_count": 0,
                        "bytes_count": 0,
                        "last_active_months_ago": 0.0,
                    },
                })

    scored_skills.sort(key=lambda s: s["score"], reverse=True)
    scan_id = f"quiz-{uuid.uuid4()}"
    now = datetime.now(timezone.utc)

    # Store quiz scores in MongoDB
    await db["skill_scores"].update_one(
        {"firebase_uid": uid},
        {
            "$set": {
                "scan_id": scan_id,
                "firebase_uid": uid,
                "source": "quiz",
                "formula_version": "quiz-v1.0",
                "calculated_at": now.isoformat(),
                "is_cold_start": True,
                "scores": scored_skills,
            }
        },
        upsert=True,
    )

    return {
        "success": True,
        "scan_id": scan_id,
        "is_cold_start": True,
        "scores": scored_skills,
    }


@router.get("/history")
async def get_skills_history(user: dict = Depends(get_current_user)):
    """
    Returns historical scan timeline data for growth line charting (FR-11).
    Shows before/after skill progression over scans.
    """
    db = get_db()
    uid = user["uid"]

    cursor = db["scans"].find({"firebase_uid": uid}).sort("created_at", 1)
    scan_docs = await cursor.to_list(30)

    timeline_points = []
    top_tracked_skills = set()

    for s in scan_docs:
        created = s.get("created_at")
        date_label = created.strftime("%d %b %H:%M") if hasattr(created, "strftime") else str(created)[:16]

        point = {
            "scan_id": s.get("scan_id"),
            "date": date_label,
            "repo_count": s.get("repo_count", 0),
            "total_commits": s.get("total_commits", 0),
        }

        # Include scores for each skill
        for item in s.get("scores", [])[:6]:  # Track top 6 skills
            point[item["name"]] = item["score"]
            top_tracked_skills.add(item["name"])

        timeline_points.append(point)

    # Latest delta from most recent scan
    latest_deltas = []
    if scan_docs and "deltas" in scan_docs[-1]:
        latest_deltas = scan_docs[-1]["deltas"]

    return {
        "total_scans": len(scan_docs),
        "tracked_skills": list(top_tracked_skills),
        "timeline": timeline_points,
        "latest_deltas": latest_deltas,
    }
