"""
SkillForge AI — Auth Routes

- GET  /api/auth/me: Retrieve current user or auto-create on first login
- PATCH /api/auth/me: Update user profile (name, github_username)
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class UserProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=100)
    github_username: str | None = Field(default=None, max_length=100)


@router.get("/me")
async def get_my_profile(user: dict = Depends(get_current_user)):
    """
    Returns the authenticated user's profile from MongoDB.
    If this is the user's first time signing in, a new user record is created.
    """
    db = get_db()
    users_col = db["users"]
    uid = user["uid"]

    doc = await users_col.find_one({"firebase_uid": uid})

    now = datetime.now(timezone.utc)
    if not doc:
        # Create new user record
        doc = {
            "firebase_uid": uid,
            "email": user.get("email"),
            "display_name": user.get("name") or (user.get("email", "").split("@")[0] if user.get("email") else "Learner"),
            "photo_url": user.get("picture"),
            "github_username": None,
            "created_at": now,
            "updated_at": now,
        }
        res = await users_col.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
    else:
        doc["_id"] = str(doc["_id"])

    return doc


@router.patch("/me")
async def update_my_profile(
    updates: UserProfileUpdate,
    user: dict = Depends(get_current_user),
):
    """
    Update editable fields of the user's profile (display_name, github_username).
    """
    db = get_db()
    users_col = db["users"]
    uid = user["uid"]

    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields provided to update.",
        )

    update_data["updated_at"] = datetime.now(timezone.utc)

    result = await users_col.find_one_and_update(
        {"firebase_uid": uid},
        {"$set": update_data},
        return_document=True,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    result["_id"] = str(result["_id"])
    return result


@router.delete("/account")
async def delete_user_account(user: dict = Depends(get_current_user)):
    """
    Permanently delete the user's account and all associated data (GDPR / Privacy).
    Removes user doc, scan history, scores, roadmaps, projects, and mentor chat.
    """
    db = get_db()
    uid = user["uid"]

    collections = [
        "users",
        "scans",
        "skill_scores",
        "roadmaps",
        "user_projects",
        "mentor_conversations",
        "github_analysis",
        "resource_feedback",
        "oauth_states",
    ]

    for col_name in collections:
        await db[col_name].delete_many({"firebase_uid": uid})

    return {
        "success": True,
        "message": "Account and all associated learning data have been permanently deleted.",
    }
