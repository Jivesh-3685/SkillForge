import io
import json
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
import pypdf

TAXONOMY_PATH = Path(__file__).parent.parent / "taxonomy.json"

def _load_taxonomy() -> List[Dict[str, Any]]:
    if TAXONOMY_PATH.exists():
        with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("skills", [])
    return []

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract readable text from PDF bytes."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        text_parts = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_parts.append(t)
        return "\n".join(text_parts).strip()
    except Exception as e:
        raise ValueError(f"Could not read PDF: {str(e)}")

def extract_claimed_skills(resume_text: str) -> List[Dict[str, Any]]:
    """Scan resume text against taxonomy keywords and return matched skills."""
    taxonomy = _load_taxonomy()
    lower_text = resume_text.lower()
    claimed = []

    for item in taxonomy:
        skill_id = item["id"]
        skill_name = item["name"]
        keywords = item.get("keywords", []) + [skill_name.lower()]
        
        matches = []
        for kw in keywords:
            clean_kw = re.escape(kw.lower())
            pattern = rf"(?:^|[^\w#+]){clean_kw}(?:[^\w#+]|$)"
            if re.search(pattern, lower_text):
                matches.append(kw)
        
        if matches:
            claimed.append({
                "skill_id": skill_id,
                "name": skill_name,
                "category": item.get("category", "General"),
                "matched_keywords": list(set(matches))
            })

    return claimed

def analyze_resume_against_skills(resume_text: str, user_scores: Any) -> Dict[str, Any]:
    """
    Compare claimed resume skills against verified GitHub skill scores.
    Categorizes into:
    - verified: Claimed & backed by solid GitHub code (score >= 35)
    - unverified: Claimed on resume but weak or zero GitHub proof (< 35)
    - hidden_strengths: Present in GitHub (score >= 35) but omitted from resume
    """
    claimed = extract_claimed_skills(resume_text)
    
    # Normalize user_scores into a dict mapping skill_id -> score_dict
    scores_dict: Dict[str, Any] = {}
    if isinstance(user_scores, dict):
        raw = user_scores.get("scores", [])
        if isinstance(raw, list):
            for s in raw:
                if isinstance(s, dict) and "skill_id" in s:
                    scores_dict[s["skill_id"]] = s
        elif isinstance(raw, dict):
            scores_dict = raw
    elif isinstance(user_scores, list):
        for s in user_scores:
            if isinstance(s, dict) and "skill_id" in s:
                scores_dict[s["skill_id"]] = s

    verified = []
    unverified = []
    claimed_ids = set()

    for item in claimed:
        s_id = item["skill_id"]
        claimed_ids.add(s_id)
        skill_data = scores_dict.get(s_id, {})
        score = skill_data.get("score", 0)
        confidence = skill_data.get("confidence", "none")
        metrics = skill_data.get("metrics", {})
        repos_count = metrics.get("repos_count", 0)
        commits_count = metrics.get("commits_count", 0)

        if score >= 35:
            verified.append({
                "skill_id": s_id,
                "name": item["name"],
                "category": item["category"],
                "score": score,
                "confidence": confidence,
                "status": "Verified Strong" if score >= 60 else "Verified Solid",
                "repos_count": repos_count,
                "commits_count": commits_count
            })
        elif score > 0:
            unverified.append({
                "skill_id": s_id,
                "name": item["name"],
                "category": item["category"],
                "score": score,
                "confidence": confidence,
                "status": "Needs More Proof",
                "risk": "Low GitHub activity. Interviewers may question claimed proficiency.",
                "suggestion": f"Build or contribute a repository showcasing {item['name']}."
            })
        else:
            unverified.append({
                "skill_id": s_id,
                "name": item["name"],
                "category": item["category"],
                "score": 0,
                "confidence": "none",
                "status": "Unverified (Zero GitHub Proof)",
                "risk": "No code found in public repositories.",
                "suggestion": f"Add public projects or commit history demonstrating {item['name']}."
            })

    # Sort verified descending by score
    verified.sort(key=lambda x: x["score"], reverse=True)
    unverified.sort(key=lambda x: x["score"])

    # Identify hidden strengths: Verified skills with score >= 35 NOT claimed on resume
    hidden_strengths = []
    taxonomy = _load_taxonomy()
    tax_names = {t["id"]: t["name"] for t in taxonomy}
    tax_cats = {t["id"]: t.get("category", "General") for t in taxonomy}

    for s_id, s_data in scores_dict.items():
        if s_id not in claimed_ids and isinstance(s_data, dict):
            score = s_data.get("score", 0)
            if score >= 35:
                hidden_strengths.append({
                    "skill_id": s_id,
                    "name": tax_names.get(s_id, s_id.replace("_", " ").title()),
                    "category": tax_cats.get(s_id, "General"),
                    "score": score,
                    "suggestion": f"You have {score}% verified skill in {tax_names.get(s_id, s_id)} on GitHub. Consider listing it on your resume!"
                })

    hidden_strengths.sort(key=lambda x: x["score"], reverse=True)

    total_claimed = len(claimed)
    verified_count = len(verified)
    credibility_pct = round((verified_count / total_claimed * 100)) if total_claimed > 0 else 0

    recommendations = []
    if credibility_pct >= 80:
        recommendations.append("High Credibility: Most skills listed on your resume have tangible code proof on GitHub.")
    elif credibility_pct >= 50:
        recommendations.append("Moderate Credibility: About half your claimed skills are backed by code. Bolster the unverified ones with dedicated repos.")
    else:
        recommendations.append("Verification Alert: Several skills on your resume lack public GitHub activity. Hiring managers checking your profile may consider them unproven.")

    if hidden_strengths:
        top_hidden = ", ".join(h["name"] for h in hidden_strengths[:3])
        recommendations.append(f"Omission Opportunity: You demonstrate solid GitHub activity in {top_hidden}, but omitted them from your resume.")

    return {
        "summary": {
            "total_claimed": total_claimed,
            "verified_count": verified_count,
            "unverified_count": len(unverified),
            "hidden_strengths_count": len(hidden_strengths),
            "credibility_pct": credibility_pct,
            "char_count": len(resume_text),
            "word_count": len(resume_text.split())
        },
        "verified_skills": verified,
        "unverified_skills": unverified,
        "hidden_strengths": hidden_strengths,
        "recommendations": recommendations
    }
