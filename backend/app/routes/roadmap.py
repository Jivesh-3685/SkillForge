"""
SkillForge AI — Learning Roadmap Routes (FR-05)

- POST  /api/roadmap/generate     -> Generate or regenerate AI learning roadmap
- GET   /api/roadmap              -> Fetch user's active learning roadmap
- PATCH /api/roadmap/tasks/{id}   -> Toggle task completion status
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.database import get_db
from app.services.gap_analyzer import GapAnalyzer
from app.services.roadmap_generator import generate_gemini_roadmap

router = APIRouter(prefix="/api/roadmap", tags=["Roadmap"])
gap_analyzer = GapAnalyzer()


class GenerateRoadmapRequest(BaseModel):
    weekly_hours: int = Field(default=10, ge=3, le=40)


class UpdateTaskRequest(BaseModel):
    completed: bool


def calculate_progress(weeks: list[dict]) -> dict:
    total_tasks = 0
    completed_tasks = 0
    total_hours = 0.0
    completed_hours = 0.0

    for w in weeks:
        for t in w.get("tasks", []):
            total_tasks += 1
            h = float(t.get("estimated_hours", 2.0))
            total_hours += h
            if t.get("completed"):
                completed_tasks += 1
                completed_hours += h

    pct = round((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0
    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "total_hours": round(total_hours, 1),
        "completed_hours": round(completed_hours, 1),
        "percentage": pct,
    }


@router.post("/generate")
async def generate_user_roadmap(
    req: GenerateRoadmapRequest = GenerateRoadmapRequest(),
    user: dict = Depends(get_current_user),
):
    """
    Generate an adaptive week-by-week roadmap targeting verified skill gaps.
    Saves and caches the roadmap in MongoDB.
    """
    db = get_db()
    uid = user["uid"]

    # 1. Get active career goal
    user_doc = await db["users"].find_one({"firebase_uid": uid})
    goal_id = user_doc.get("active_goal", "ai_engineer") if user_doc else "ai_engineer"

    # 2. Get user scores
    scores_doc = await db["skill_scores"].find_one({"firebase_uid": uid})
    user_scores = scores_doc.get("scores", []) if scores_doc else []

    # 3. Analyze gaps
    gap_report = gap_analyzer.analyze_gaps(user_scores, goal_id)
    career_id = gap_report["career_id"]
    career_title = gap_report["career_title"]
    ranked_gaps = gap_report["gaps"]

    # 4. Generate roadmap (Gemini AI with rule-based fallback)
    roadmap_obj = await generate_gemini_roadmap(
        career_id=career_id,
        career_title=career_title,
        ranked_gaps=ranked_gaps,
        weekly_hours=req.weekly_hours,
    )

    roadmap_dict = roadmap_obj.model_dump()
    roadmap_dict["firebase_uid"] = uid
    roadmap_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    roadmap_dict["progress"] = calculate_progress(roadmap_dict["weeks"])

    # 5. Save to MongoDB roadmaps collection
    await db["roadmaps"].update_one(
        {"firebase_uid": uid},
        {"$set": roadmap_dict},
        upsert=True,
    )

    return roadmap_dict


@router.get("")
async def get_user_roadmap(user: dict = Depends(get_current_user)):
    """Fetch the learner's current active roadmap."""
    db = get_db()
    uid = user["uid"]

    doc = await db["roadmaps"].find_one({"firebase_uid": uid})
    if not doc:
        return {"has_roadmap": False}

    doc["_id"] = str(doc["_id"])
    doc["has_roadmap"] = True
    doc["progress"] = calculate_progress(doc.get("weeks", []))
    return doc


@router.patch("/tasks/{task_id}")
async def update_task_status(
    task_id: str,
    req: UpdateTaskRequest,
    user: dict = Depends(get_current_user),
):
    """Mark a task completed or incomplete."""
    db = get_db()
    uid = user["uid"]

    doc = await db["roadmaps"].find_one({"firebase_uid": uid})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No roadmap found. Please generate one first.",
        )

    weeks = doc.get("weeks", [])
    task_found = False

    for w in weeks:
        for t in w.get("tasks", []):
            if t.get("task_id") == task_id:
                t["completed"] = req.completed
                t["completed_at"] = (
                    datetime.now(timezone.utc).isoformat() if req.completed else None
                )
                task_found = True
                break
        if task_found:
            break

    if not task_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found in your roadmap.",
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    progress = calculate_progress(weeks)

    await db["roadmaps"].update_one(
        {"firebase_uid": uid},
        {
            "$set": {
                "weeks": weeks,
                "updated_at": now_iso,
                "progress": progress,
            }
        },
    )

    doc["_id"] = str(doc["_id"])
    doc["weeks"] = weeks
    doc["progress"] = progress
    doc["has_roadmap"] = True
    return doc
