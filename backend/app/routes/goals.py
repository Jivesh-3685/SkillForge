"""
SkillForge AI — Career Goals & Skill Gap Analysis Routes (FR-04)

- GET  /api/goals        -> List all available career goals
- POST /api/goals        -> Set or update the learner's active goal
- GET  /api/goals/active -> Get current learner's active goal
- GET  /api/skills/gaps  -> Compute ranked gaps between current scores and career target
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.database import get_db
from app.services.gap_analyzer import GapAnalyzer, load_careers

router = APIRouter(tags=["Goals & Gaps"])
analyzer = GapAnalyzer()


class SetGoalRequest(BaseModel):
    goal_id: str = Field(..., description="ID of the target career (e.g. ai_engineer, fullstack_developer)")


@router.get("/api/goals")
async def list_career_goals():
    """List all available career target profiles."""
    careers = load_careers()
    return {"careers": careers}


@router.get("/api/goals/active")
async def get_active_goal(user: dict = Depends(get_current_user)):
    """Get the learner's current active goal (defaults to ai_engineer)."""
    db = get_db()
    uid = user["uid"]
    doc = await db["users"].find_one({"firebase_uid": uid})
    active_goal = doc.get("active_goal", "ai_engineer") if doc else "ai_engineer"
    career = analyzer.get_career(active_goal) or analyzer.get_career("ai_engineer")
    return {"active_goal": active_goal, "career": career}


@router.post("/api/goals")
async def set_active_goal(req: SetGoalRequest, user: dict = Depends(get_current_user)):
    """Set or change the learner's active career goal."""
    if not analyzer.get_career(req.goal_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown career goal ID '{req.goal_id}'.",
        )

    db = get_db()
    uid = user["uid"]

    await db["users"].update_one(
        {"firebase_uid": uid},
        {"$set": {"active_goal": req.goal_id}},
        upsert=True,
    )

    career = analyzer.get_career(req.goal_id)
    return {
        "success": True,
        "active_goal": req.goal_id,
        "career": career,
        "message": f"Career goal updated to {career['title']}.",
    }


@router.get("/api/skills/gaps")
async def get_skill_gaps(
    goal_id: str | None = Query(default=None, description="Optional career ID override"),
    user: dict = Depends(get_current_user),
):
    """
    Perform instant gap analysis comparing user's verified/quiz scores
    against the target career requirement profile.
    """
    db = get_db()
    uid = user["uid"]

    # 1. Determine active goal
    if not goal_id:
        user_doc = await db["users"].find_one({"firebase_uid": uid})
        goal_id = user_doc.get("active_goal", "ai_engineer") if user_doc else "ai_engineer"

    if not analyzer.get_career(goal_id):
        goal_id = "ai_engineer"

    # 2. Get user's latest scores
    scores_doc = await db["skill_scores"].find_one({"firebase_uid": uid})
    user_scores = scores_doc.get("scores", []) if scores_doc else []

    # 3. Analyze gaps
    try:
        gap_report = analyzer.analyze_gaps(user_scores, goal_id)
        return gap_report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gap analysis calculation error: {str(e)}",
        )
