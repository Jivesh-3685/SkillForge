"""
SkillForge AI — Resource Recommendation Service (FR-06)

Serves 100% free, curated learning materials (Docs, Videos, Courses).
No hallucinated links; all URLs are strictly loaded from verified dataset.
Learners can vote 'helpful' / 'not helpful' to rank resources.
"""

import json
from pathlib import Path

RESOURCES_PATH = Path(__file__).resolve().parent.parent / "resources.json"


def load_resources() -> list[dict]:
    with open(RESOURCES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("resources", [])


class ResourceService:
    def __init__(self):
        self.resources = load_resources()
        self.by_skill: dict[str, list[dict]] = {}
        for r in self.resources:
            s_id = r["skill_id"]
            if s_id not in self.by_skill:
                self.by_skill[s_id] = []
            self.by_skill[s_id].append(r)

    def get_by_skill(self, skill_id: str, limit: int = 5) -> list[dict]:
        items = self.by_skill.get(skill_id, [])
        # Return sorted by votes descending
        return sorted(items, key=lambda x: x.get("votes", 0), reverse=True)[:limit]

    def get_for_skills(self, skill_ids: list[str]) -> dict[str, list[dict]]:
        result = {}
        for s in skill_ids:
            res = self.get_by_skill(s)
            if res:
                result[s] = res
        return result
