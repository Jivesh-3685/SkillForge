"""
SkillForge AI — Grounded & Wide AI Mentor Routes (FR-09)

- POST   /api/mentor/chat    -> Send question, receive wide/grounded advice
- GET    /api/mentor/status  -> Check Google Gemini AI key status
- POST   /api/mentor/api-key -> Save user Google Gemini API key
- DELETE /api/mentor/api-key -> Remove saved API key
- GET    /api/mentor/history -> Fetch persistent conversation history
- DELETE /api/mentor/history -> Clear conversation history
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.services.gap_analyzer import GapAnalyzer
from app.services.mentor_service import build_learner_context, get_mentor_response

router = APIRouter(prefix="/api/mentor", tags=["Mentor"])
gap_analyzer = GapAnalyzer()


class MentorChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    api_key: Optional[str] = Field(None, max_length=200)


class SaveApiKeyRequest(BaseModel):
    api_key: str = Field(..., min_length=10, max_length=200)


@router.get("/status")
async def get_mentor_status(user: dict = Depends(get_current_user)):
    """Check if Google Gemini AI is active and configured."""
    db = get_db()
    uid = user["uid"]
    user_doc = await db["users"].find_one({"firebase_uid": uid})

    user_has_key = bool(user_doc and user_doc.get("gemini_api_key"))
    env_has_key = bool(settings.gemini_api_key)

    has_active_key = user_has_key or env_has_key
    source = "profile" if user_has_key else ("env" if env_has_key else "none")

    return {
        "has_gemini_key": has_active_key,
        "source": source,
        "provider": "Google Gemini AI",
        "recommended_model": "gemini-1.5-flash",
    }


@router.post("/api-key")
async def save_gemini_api_key(
    req: SaveApiKeyRequest,
    user: dict = Depends(get_current_user),
):
    """Save Google Gemini API key to user profile."""
    key = req.api_key.strip()
    if not (key.startswith("AIza") or len(key) >= 20):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google Gemini API key format. Keys typically start with 'AIza...'",
        )

    db = get_db()
    uid = user["uid"]
    await db["users"].update_one(
        {"firebase_uid": uid},
        {"$set": {"gemini_api_key": key, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )

    return {"status": "ok", "message": "Google Gemini API key saved successfully!"}


@router.delete("/api-key")
async def remove_gemini_api_key(user: dict = Depends(get_current_user)):
    """Remove user's saved Google Gemini API key."""
    db = get_db()
    uid = user["uid"]
    await db["users"].update_one(
        {"firebase_uid": uid},
        {"$unset": {"gemini_api_key": ""}},
    )
    return {"status": "ok", "message": "API key removed."}


@router.post("/chat")
async def send_mentor_message(
    req: MentorChatRequest,
    user: dict = Depends(get_current_user),
):
    """
    Send a message to the AI Mentor.
    Answers broad technical/coding questions via Google Gemini API,
    grounded with verified learner metrics where applicable.
    """
    db = get_db()
    uid = user["uid"]

    # 1. Fetch learner context data
    user_doc = await db["users"].find_one({"firebase_uid": uid})
    scores_doc = await db["skill_scores"].find_one({"firebase_uid": uid})
    roadmap_doc = await db["roadmaps"].find_one({"firebase_uid": uid})

    goal_id = user_doc.get("active_goal", "ai_engineer") if user_doc else "ai_engineer"
    scores_list = scores_doc.get("scores", []) if scores_doc else []
    gap_report = gap_analyzer.analyze_gaps(scores_list, goal_id)

    # 2. Build prompt context
    context_str = build_learner_context(user_doc, scores_list, gap_report, roadmap_doc)

    # 3. Fetch past conversation history
    convo_doc = await db["mentor_conversations"].find_one({"firebase_uid": uid})
    messages = convo_doc.get("messages", []) if convo_doc else []

    # 4. Determine effective API key
    effective_api_key = req.api_key or (user_doc.get("gemini_api_key") if user_doc else None) or settings.gemini_api_key

    # 5. Generate wide & grounded response
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    reply_text = await get_mentor_response(
        user_message=req.message,
        context_str=context_str,
        conversation_history=messages,
        gap_report=gap_report,
        api_key=effective_api_key,
    )

    # 6. Persist message exchange in MongoDB (keep last 30 messages)
    new_user_msg = {"role": "user", "content": req.message, "timestamp": now_iso}
    new_model_msg = {"role": "model", "content": reply_text, "timestamp": now_iso}
    updated_messages = (messages + [new_user_msg, new_model_msg])[-30:]

    await db["mentor_conversations"].update_one(
        {"firebase_uid": uid},
        {
            "$set": {
                "firebase_uid": uid,
                "messages": updated_messages,
                "updated_at": now_iso,
            }
        },
        upsert=True,
    )

    return {
        "reply": reply_text,
        "timestamp": now_iso,
    }


@router.get("/history")
async def get_mentor_history(user: dict = Depends(get_current_user)):
    """Fetch persistent mentor conversation history."""
    db = get_db()
    uid = user["uid"]

    doc = await db["mentor_conversations"].find_one({"firebase_uid": uid})
    messages = doc.get("messages", []) if doc else []
    return {"messages": messages}


@router.delete("/history")
async def clear_mentor_history(user: dict = Depends(get_current_user)):
    """Clear mentor conversation history."""
    db = get_db()
    uid = user["uid"]

    await db["mentor_conversations"].delete_one({"firebase_uid": uid})
    return {"status": "ok", "message": "Conversation history cleared."}
