"""
SkillForge AI — Grounded AI Mentor Routes (FR-09)

- POST   /api/mentor/chat    -> Send question, receive grounded advice
- GET    /api/mentor/history -> Fetch persistent conversation history
- DELETE /api/mentor/history -> Clear conversation history
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.database import get_db
from app.services.gap_analyzer import GapAnalyzer
from app.services.mentor_service import build_learner_context, get_mentor_response

router = APIRouter(prefix="/api/mentor", tags=["Mentor"])
gap_analyzer = GapAnalyzer()


class MentorChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


@router.post("/chat")
async def send_mentor_message(
    req: MentorChatRequest,
    user: dict = Depends(get_current_user),
):
    """
    Send a message to the AI Mentor.
    Response is grounded in the learner's verified scores, gaps, and roadmap.
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

    # 2. Build concise prompt context
    context_str = build_learner_context(user_doc, scores_list, gap_report, roadmap_doc)

    # 3. Fetch past conversation history
    convo_doc = await db["mentor_conversations"].find_one({"firebase_uid": uid})
    messages = convo_doc.get("messages", []) if convo_doc else []

    # 4. Generate grounded response
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    reply_text = await get_mentor_response(
        user_message=req.message,
        context_str=context_str,
        conversation_history=messages,
        gap_report=gap_report,
    )

    # 5. Persist message exchange in MongoDB (keep last 30 messages)
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
    return {"success": True, "message": "Conversation history cleared."}
