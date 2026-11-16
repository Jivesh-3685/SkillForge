"""
SkillForge AI — Project Matcher Service (FR-07)

Deterministic rule-based matching:
- Matches projects against verified current skills + 1-2 stretch skills from the roadmap.
- Ensures projects are neither too easy nor too hard.
- Excludes already completed projects.
"""

import json
from pathlib import Path

PROJECTS_PATH = Path(__file__).resolve().parent.parent / "projects.json"


def load_projects() -> list[dict]:
    with open(PROJECTS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("projects", [])


class ProjectMatcher:
    def __init__(self):
        self.projects = load_projects()

    def match_projects(
        self,
        user_scores: list[dict],
        career_id: str,
        user_project_statuses: dict[str, str],  # { "proj-ai-1": "completed" }
    ) -> list[dict]:
        score_map = {s.get("skill_id"): s.get("score", 0) for s in user_scores}

        recommendations = []
        for proj in self.projects:
            p_id = proj["id"]
            current_status = user_project_statuses.get(p_id, "suggested")

            # Check career relevance
            relevance = proj.get("career_relevance", [])
            is_relevant = (career_id in relevance) or (len(relevance) == 0)
            if not is_relevant:
                continue

            primary = proj.get("primary_skills", [])
            stretch = proj.get("stretch_skills", [])

            # Compute primary readiness: avg score of primary skills
            if primary:
                primary_scores = [score_map.get(s, 0) for s in primary]
                primary_avg = sum(primary_scores) / len(primary_scores)
            else:
                primary_avg = 50.0

            # Compute stretch potential: score of stretch skills
            stretch_scores = [score_map.get(s, 0) for s in stretch]
            stretch_avg = sum(stretch_scores) / len(stretch_scores) if stretch_scores else 0.0

            # Match criteria:
            # Ideal project: primary_avg >= 20 (learner has some foundation) and stretch_avg < 80 (room to grow)
            fit_score = primary_avg * 0.6 + (100 - stretch_avg) * 0.4

            # Readiness label
            if primary_avg >= 45:
                readiness_label = "Optimal Match"
            elif primary_avg >= 20:
                readiness_label = "Stretch Challenge"
            else:
                readiness_label = "Advanced Goal"

            recommendations.append({
                **proj,
                "status": current_status,
                "primary_readiness_score": round(primary_avg),
                "readiness_label": readiness_label,
                "fit_score": round(fit_score, 1),
            })

        # Sort: in_progress first, then optimal matches by fit_score descending, completed last
        def sort_key(p):
            status_weight = 0 if p["status"] == "in_progress" else (1 if p["status"] == "suggested" else 2)
            return (status_weight, -p["fit_score"])

        recommendations.sort(key=sort_key)
        return recommendations
