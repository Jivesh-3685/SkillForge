from app.services.resume_analyzer import (
    extract_claimed_skills,
    analyze_resume_against_skills,
)

SAMPLE_RESUME = """
Jane Doe
Software Engineer
Email: jane@example.com

SKILLS:
- Languages: Python, JavaScript, TypeScript
- Frameworks: React, FastAPI, Docker
- AI/ML: Machine Learning, PyTorch, Deep Learning
- Databases: PostgreSQL, MongoDB

EXPERIENCE:
Built full-stack applications with React and FastAPI. Managed containerized deployments with Docker.
"""

def test_extract_claimed_skills():
    claimed = extract_claimed_skills(SAMPLE_RESUME)
    skill_ids = [c["skill_id"] for c in claimed]

    assert "python" in skill_ids
    assert "react" in skill_ids
    assert "fastapi" in skill_ids
    assert "docker" in skill_ids
    assert "deep_learning" in skill_ids
    assert len(claimed) >= 5

def test_resume_analysis_verified_and_unverified():
    # User has verified Python and React, but zero Docker or Deep Learning
    user_skills = {
        "scores": [
            {
                "skill_id": "python",
                "name": "Python",
                "score": 85,
                "confidence": "high",
                "metrics": {"repos_count": 5, "commits_count": 80}
            },
            {
                "skill_id": "react",
                "name": "React",
                "score": 60,
                "confidence": "medium",
                "metrics": {"repos_count": 2, "commits_count": 35}
            },
            {
                "skill_id": "git",
                "name": "Git & Version Control",
                "score": 75,
                "confidence": "high",
                "metrics": {"repos_count": 6, "commits_count": 100}
            }
        ]
    }

    result = analyze_resume_against_skills(SAMPLE_RESUME, user_skills)
    summary = result["summary"]
    verified = result["verified_skills"]
    unverified = result["unverified_skills"]
    hidden = result["hidden_strengths"]

    # Python & React should be verified
    verified_ids = [v["skill_id"] for v in verified]
    assert "python" in verified_ids
    assert "react" in verified_ids

    # Docker & Deep Learning should be unverified (zero GitHub score)
    unverified_ids = [u["skill_id"] for u in unverified]
    assert "docker" in unverified_ids
    assert "deep_learning" in unverified_ids

    # Git was verified (75%) but not explicitly listed in the resume, so it should be in hidden_strengths
    hidden_ids = [h["skill_id"] for h in hidden]
    assert "git" in hidden_ids

    # Credibility percentage should be calculated
    assert 0 < summary["credibility_pct"] < 100
    assert len(result["recommendations"]) > 0
