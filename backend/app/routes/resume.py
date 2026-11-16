from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.auth import get_current_user
from app.database import get_db
from app.services.resume_analyzer import (
    extract_text_from_pdf,
    analyze_resume_against_skills
)

router = APIRouter(prefix="/api/resume", tags=["Resume Analyzer (FR-10)"])

@router.post("/analyze")
async def analyze_resume(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    FR-10: Upload a resume (PDF/TXT) or submit raw text to compare claimed skills
    against verified GitHub activity.
    """
    text_to_analyze = ""

    if file and file.filename:
        filename = file.filename.lower()
        content = await file.read()
        if filename.endswith(".pdf"):
            try:
                text_to_analyze = extract_text_from_pdf(content)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to read PDF file: {str(e)}")
        elif filename.endswith((".txt", ".md")):
            try:
                text_to_analyze = content.decode("utf-8", errors="replace")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to decode text file: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail="Only PDF and TXT/MD files are supported.")
    elif resume_text and resume_text.strip():
        text_to_analyze = resume_text.strip()
    else:
        raise HTTPException(status_code=400, detail="Please upload a PDF/text file or paste resume text.")

    if len(text_to_analyze.strip()) < 20:
        raise HTTPException(status_code=400, detail="Resume content is too short to analyze.")

    db = get_db()
    uid = current_user["uid"]
    user_skills = await db["skill_scores"].find_one({"firebase_uid": uid})
    if not user_skills:
        user_skills = {"scores": []}

    analysis = analyze_resume_against_skills(text_to_analyze, user_skills)

    # Save snapshot to database
    doc = {
        "firebase_uid": uid,
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
        "summary": analysis["summary"],
        "verified_skills": analysis["verified_skills"],
        "unverified_skills": analysis["unverified_skills"],
        "hidden_strengths": analysis["hidden_strengths"],
        "recommendations": analysis["recommendations"]
    }
    await db["resumes"].update_one(
        {"firebase_uid": uid},
        {"$set": doc},
        upsert=True
    )

    return analysis

@router.get("/latest")
async def get_latest_resume_analysis(current_user: dict = Depends(get_current_user)):
    """Retrieve the learner's most recent resume analysis."""
    db = get_db()
    uid = current_user["uid"]
    doc = await db["resumes"].find_one({"firebase_uid": uid})
    if not doc:
        return {"has_analysis": False}
    
    doc["_id"] = str(doc["_id"])
    doc["has_analysis"] = True
    return doc
