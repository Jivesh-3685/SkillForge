"""
SkillForge AI — Project Recommendations Routes (FR-07)

- GET   /api/projects/recommendations  -> Fetch matched projects
- PATCH /api/projects/{id}             -> Update status (suggested, in_progress, completed)
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.database import get_db
from app.services.project_matcher import ProjectMatcher

router = APIRouter(prefix="/api/projects", tags=["Projects"])
matcher = ProjectMatcher()


class UpdateProjectStatusRequest(BaseModel):
    status: str = Field(
        ...,
        pattern="^(suggested|in_progress|completed)$",
        description="Project status: suggested, in_progress, or completed",
    )


@router.get("/recommendations")
async def get_project_recommendations(user: dict = Depends(get_current_user)):
    """
    Fetch personalized project suggestions matched to learner's current skills
    plus 1-2 stretch skills from their roadmap.
    """
    db = get_db()
    uid = user["uid"]

    # 1. Get user's active goal
    user_doc = await db["users"].find_one({"firebase_uid": uid})
    goal_id = user_doc.get("active_goal", "ai_engineer") if user_doc else "ai_engineer"

    # 2. Get user's skill scores
    scores_doc = await db["skill_scores"].find_one({"firebase_uid": uid})
    user_scores = scores_doc.get("scores", []) if scores_doc else []

    # 3. Get user's existing project statuses
    cursor = db["user_projects"].find({"firebase_uid": uid})
    user_project_docs = await cursor.to_list(100)
    user_statuses = {p["project_id"]: p["status"] for p in user_project_docs}

    # 4. Compute matched recommendations
    matched = matcher.match_projects(
        user_scores=user_scores,
        career_id=goal_id,
        user_project_statuses=user_statuses,
    )

    in_progress_count = sum(1 for p in matched if p["status"] == "in_progress")
    completed_count = sum(1 for p in matched if p["status"] == "completed")

    return {
        "career_id": goal_id,
        "total_projects": len(matched),
        "in_progress_count": in_progress_count,
        "completed_count": completed_count,
        "projects": matched,
    }


@router.patch("/{project_id}")
async def update_project_status(
    project_id: str,
    req: UpdateProjectStatusRequest,
    user: dict = Depends(get_current_user),
):
    """
    Update project status (e.g. mark in_progress or completed).
    Completed projects feed into portfolio accomplishments.
    """
    db = get_db()
    uid = user["uid"]

    # Verify project exists
    matching = [p for p in matcher.projects if p["id"] == project_id]
    if not matching:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found.",
        )

    now = datetime.now(timezone.utc)
    await db["user_projects"].update_one(
        {"firebase_uid": uid, "project_id": project_id},
        {
            "$set": {
                "firebase_uid": uid,
                "project_id": project_id,
                "status": req.status,
                "updated_at": now.isoformat(),
            }
        },
        upsert=True,
    )

    return {
        "success": True,
        "project_id": project_id,
        "status": req.status,
        "updated_at": now.isoformat(),
    }
