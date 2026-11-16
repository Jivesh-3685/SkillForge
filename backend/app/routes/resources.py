"""
SkillForge AI — Resource Recommendation Routes (FR-06)

- GET  /api/resources          -> Get recommended free resources for a skill
- GET  /api/resources/roadmap  -> Get all resources mapped to active roadmap skills
- POST /api/resources/{id}/feedback -> Upvote / downvote resource
"""

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.database import get_db
from app.services.resource_service import ResourceService

router = APIRouter(prefix="/api/resources", tags=["Resources"])
resource_service = ResourceService()


class ResourceFeedbackRequest(BaseModel):
    helpful: bool = Field(..., description="True if resource was helpful, False otherwise")


@router.get("")
async def get_resources(skill: str = Query(..., description="Target skill ID (e.g. python, react)")):
    """Fetch free curated resources for a specific skill."""
    items = resource_service.get_by_skill(skill)
    return {"skill_id": skill, "count": len(items), "resources": items}


@router.get("/roadmap")
async def get_roadmap_resources(user: dict = Depends(get_current_user)):
    """
    Fetch curated free resources for all target skills currently featured
    in the learner's active roadmap.
    """
    db = get_db()
    uid = user["uid"]

    doc = await db["roadmaps"].find_one({"firebase_uid": uid})
    if not doc:
        return {"resources_by_skill": {}}

    weeks = doc.get("weeks", [])
    all_skill_ids = set()
    for w in weeks:
        for s in w.get("target_skills", []):
            all_skill_ids.add(s)
        for t in w.get("tasks", []):
            if t.get("skill_id"):
                all_skill_ids.add(t["skill_id"])

    res_map = resource_service.get_for_skills(list(all_skill_ids))
    return {"resources_by_skill": res_map}


@router.post("/{resource_id}/feedback")
async def submit_resource_feedback(
    resource_id: str,
    req: ResourceFeedbackRequest,
    user: dict = Depends(get_current_user),
):
    """
    Submit feedback on a resource (helpful / not helpful).
    'Not helpful' feedback lowers its ranking for the user.
    """
    db = get_db()
    uid = user["uid"]

    vote_val = 1 if req.helpful else -1
    await db["resource_feedback"].update_one(
        {"firebase_uid": uid, "resource_id": resource_id},
        {"$set": {"vote": vote_val}},
        upsert=True,
    )

    return {
        "success": True,
        "resource_id": resource_id,
        "vote": vote_val,
        "message": "Thank you for your feedback!",
    }
