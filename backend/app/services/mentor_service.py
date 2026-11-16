"""
SkillForge AI — Grounded AI Mentor Service (FR-09)

Generates context-aware, grounded mentor advice.
- Builds concise learner context (< 800 tokens) from scores, gaps, and roadmap.
- Uses Gemini API when GEMINI_API_KEY is available.
- Features intelligent grounded fallback for instant, reliable replies without API keys.
"""

import json
from datetime import datetime, timezone
from app.config import settings


def build_learner_context(
    user_doc: dict | None,
    scores_list: list[dict],
    gap_report: dict,
    roadmap_doc: dict | None,
) -> str:
    """Build a compact (~500 tokens) prompt context containing only verified learner facts."""
    career_title = gap_report.get("career_title", "Software Engineer")
    match_pct = gap_report.get("match_percentage", 0)

    # Top skills (up to 4)
    top_skills = [
        f"{s.get('name')}: {s.get('score')}% ({s.get('confidence')} confidence)"
        for s in scores_list[:4]
    ]

    # Top gaps (up to 3)
    top_gaps = [
        f"{g.get('name')} (Needs +{g.get('shortfall')}%, severity: {g.get('severity')})"
        for g in gap_report.get("gaps", [])[:3]
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

    return f"""LEARNER PROFILE:
- Target Career: {career_title} ({match_pct}% match readiness)
- Verified Skills: {', '.join(top_skills) if top_skills else 'No skills verified yet'}
- Top Priority Gaps: {', '.join(top_gaps) if top_gaps else 'None'}
- Current Roadmap Milestone: {current_week_theme}
- Immediate Next Action: {next_task}
"""


def generate_fallback_mentor_reply(user_message: str, context_str: str, gap_report: dict) -> str:
    """
    Grounded rule-based mentor response used when Gemini is unavailable or without API key.
    Provides helpful, factually grounded guidance without making up information.
    """
    msg = user_message.lower()
    career = gap_report.get("career_title", "your chosen career")
    gaps = gap_report.get("gaps", [])
    top_gap = gaps[0] if gaps else None

    if any(k in msg for k in ("what should i", "focus", "today", "next", "start")):
        if top_gap:
            return (
                f"Based on your verified skills for **{career}**, your highest-priority gap is **{top_gap['name']}** "
                f"(current shortfall: **+{top_gap['shortfall']}%**).\n\n"
                f"💡 **Recommended Next Step:** Work through your active roadmap milestones for {top_gap['name']}. "
                f"Once you write code and commit it to GitHub, run a Re-Scan to automatically turn that shortfall into verified proficiency!"
            )
        return "You're in great shape! Keep progressing through your active roadmap tasks and committing code to GitHub."

    if any(k in msg for k in ("gap", "score", "missing", "improve")):
        gap_bullets = "\n".join(
            [f"- **{g['name']}**: shortfall of +{g['shortfall']}% ({g['severity']})" for g in gaps[:3]]
        )
        return (
            f"Here are your top skill gaps for **{career}**:\n\n{gap_bullets}\n\n"
            f"Focusing on these three areas first will provide the highest boost to your career readiness percentage!"
        )

    if any(k in msg for k in ("roadmap", "plan", "timeline", "week")):
        return (
            f"Your roadmap is tailored around **{career}**. "
            f"Each week tackles your largest skill shortfalls with daily hands-on tasks and verified free resources. "
            f"Check off each task as you complete it to track your weekly study commitment!"
        )

    # General encouragement & grounding
    return (
        f"As your SkillForge AI mentor, I'm tracking your progress toward **{career}**. "
        f"{'Your primary focus right now is ' + top_gap['name'] + ' (+ ' + str(top_gap['shortfall']) + '% gap).' if top_gap else ''} "
        f"Feel free to ask me for study recommendations, roadmap explanations, or how to bridge specific technical gaps!"
    )


async def get_mentor_response(
    user_message: str,
    context_str: str,
    conversation_history: list[dict],
    gap_report: dict,
) -> str:
    """Generate a mentor response via Gemini API or grounded fallback."""
    if not settings.gemini_api_key:
        return generate_fallback_mentor_reply(user_message, context_str, gap_report)

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)

        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=(
                "You are SkillForge AI, a supportive, pragmatic technical mentor. "
                "Always ground your advice in the learner's actual profile data provided in the context. "
                "Be concise, encouraging, and provide concrete technical next steps. "
                "Never invent facts about the user's background or skills that are not in the context. "
                "If asked something you cannot verify from their data, clarify politely."
            ),
        )

        chat_history = []
        # Include last 6 messages
        for m in conversation_history[-6:]:
            role = "user" if m.get("role") == "user" else "model"
            chat_history.append({"role": role, "parts": [m.get("content", "")]})

        chat = model.start_chat(history=chat_history)
        full_prompt = f"{context_str}\n\nUser Question: {user_message}"
        response = await chat.send_message_async(full_prompt)
        return response.text

    except Exception as e:
        print(f"Gemini mentor chat error ({str(e)}), using grounded fallback.")
        return generate_fallback_mentor_reply(user_message, context_str, gap_report)
