"""
SkillForge AI — Skill Gap Analysis Service (FR-04)

Pure function: User's verified scores + career requirements -> Ranked skill gaps.
Instant calculation, deterministic, no AI hallucinations, zero network calls.
"""

import json
from pathlib import Path

CAREERS_PATH = Path(__file__).resolve().parent.parent / "careers.json"


def load_careers() -> list[dict]:
    with open(CAREERS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("careers", [])


class GapAnalyzer:
    def __init__(self):
        self.careers = load_careers()
        self.careers_map = {c["id"]: c for c in self.careers}

    def get_career(self, career_id: str) -> dict | None:
        return self.careers_map.get(career_id)

    def analyze_gaps(self, user_scores: list[dict], career_id: str) -> dict:
        career = self.get_career(career_id)
        if not career:
            # Fallback gracefully to default target career
            career = self.get_career("ai_engineer") or (self.careers[0] if self.careers else None)
        if not career:
            raise ValueError(f"Unknown career goal ID: '{career_id}'")

        # Map user scores by skill_id
        score_lookup = {}
        for s in user_scores:
            score_lookup[s.get("skill_id")] = s.get("score", 0)

        gaps = []
        weighted_current_sum = 0.0
        weighted_target_sum = 0.0

        for req in career["required_skills"]:
            s_id = req["skill_id"]
            name = req["name"]
            target = req["target_score"]
            weight = req["weight"]

            current = score_lookup.get(s_id, 0)
            shortfall = max(0, target - current)
            priority = round(weight * shortfall, 2)

            if current >= target:
                severity = "mastered"
            elif current == 0 or current < (target * 0.35):
                severity = "missing"
            else:
                severity = "below"

            weighted_current_sum += min(current, target) * weight
            weighted_target_sum += target * weight

            gaps.append({
                "skill_id": s_id,
                "name": name,
                "current_score": current,
                "target_score": target,
                "weight": weight,
                "shortfall": shortfall,
                "priority_score": priority,
                "severity": severity,
            })

        # Sort gaps by priority descending (biggest priority shortfall first, mastered last)
        gaps.sort(key=lambda g: (0 if g["severity"] != "mastered" else 1, -g["priority_score"]))

        # Calculate overall career readiness match percentage
        match_percentage = int(
            round((weighted_current_sum / weighted_target_sum) * 100)
            if weighted_target_sum > 0
            else 0
        )

        missing_count = sum(1 for g in gaps if g["severity"] == "missing")
        below_count = sum(1 for g in gaps if g["severity"] == "below")
        mastered_count = sum(1 for g in gaps if g["severity"] == "mastered")

        return {
            "career_id": career["id"],
            "career_title": career["title"],
            "career_description": career["description"],
            "career_icon": career.get("icon", "🎯"),
            "match_percentage": match_percentage,
            "summary": {
                "total_skills": len(gaps),
                "mastered": mastered_count,
                "below_target": below_count,
                "missing": missing_count,
            },
            "gaps": gaps,
        }
