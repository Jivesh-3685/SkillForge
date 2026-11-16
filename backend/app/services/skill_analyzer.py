"""
SkillForge AI — Skill Analyzer Service (FR-03)

Deterministic, reproducible skill scoring from GitHub evidence.
Formula v1.0:
    score = 100 × (0.35·volume + 0.25·breadth + 0.25·activity + 0.15·recency)
    - Each factor is log-scaled and capped at 1.0
    - Recency uses exponential decay with a 12-month half-life
    - Confidence: High (>=3 repos & >=30 commits), Medium (>=2 repos or >=15 commits), Low otherwise
"""

import json
import math
import os
from datetime import datetime, timezone
from pathlib import Path

TAXONOMY_PATH = Path(__file__).resolve().parent.parent / "taxonomy.json"
FORMULA_VERSION = "v1.0"


def load_taxonomy() -> list[dict]:
    with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("skills", [])


def compute_months_ago(iso_date_str: str | None) -> float:
    if not iso_date_str:
        return 24.0  # Default to 2 years if date missing
    try:
        # Parse ISO date (e.g. 2026-11-10T12:00:00Z)
        clean_str = iso_date_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean_str)
        now = datetime.now(timezone.utc)
        diff_days = (now - dt).total_seconds() / 86400.0
        return max(0.0, diff_days / 30.44)
    except Exception:
        return 24.0


class SkillAnalyzer:
    def __init__(self):
        self.taxonomy = load_taxonomy()

    def analyze(self, scan_data: dict) -> dict:
        """
        Analyze raw GitHub scan output and compute deterministic scores
        for every skill in the taxonomy.
        """
        repos = scan_data.get("repositories", [])
        total_profile_repos = scan_data.get("repo_count", len(repos))
        total_profile_commits = scan_data.get("total_commits", sum(r.get("commits", 0) for r in repos))

        # Check cold-start condition: < 3 repos or < 30 commits total
        is_cold_start = total_profile_repos < 3 or total_profile_commits < 30

        skill_results = []

        for skill in self.taxonomy:
            skill_id = skill["id"]
            skill_name = skill["name"]
            category = skill["category"]
            target_langs = set(l.lower() for l in skill.get("languages", []))
            keywords = set(k.lower() for k in skill.get("keywords", []))

            # Match repositories relevant to this skill
            matched_repos = []
            skill_bytes = 0
            skill_commits = 0
            most_recent_months = 120.0  # 10 years ago

            for repo in repos:
                repo_name = repo.get("name", "").lower()
                repo_desc = (repo.get("description") or "").lower()
                repo_primary_lang = (repo.get("primary_language") or "").lower()
                repo_langs = repo.get("languages", {})  # { "Python": 124500 }
                repo_commits = repo.get("commits", 0)
                repo_updated = repo.get("updated_at")

                # Match by language bytes
                bytes_for_skill = 0
                for lang_name, b_count in repo_langs.items():
                    if lang_name.lower() in target_langs:
                        bytes_for_skill += b_count

                # Match by keywords in repo name or description
                keyword_match = any(
                    kw in repo_name or kw in repo_desc
                    for kw in keywords
                ) or (repo_primary_lang in target_langs)

                if bytes_for_skill > 0 or keyword_match:
                    matched_repos.append(repo)
                    skill_bytes += bytes_for_skill
                    skill_commits += repo_commits

                    months_ago = compute_months_ago(repo_updated)
                    if months_ago < most_recent_months:
                        most_recent_months = months_ago

            # Only evaluate skills with evidence
            repo_count = len(matched_repos)
            if repo_count == 0 and skill_bytes == 0 and skill_commits == 0:
                continue

            # 1. Volume: log-scaled code bytes (1MB = 1.0)
            if skill_bytes > 0:
                volume = min(1.0, math.log10(skill_bytes + 1) / 6.0)
            else:
                volume = min(0.3, repo_count * 0.1)

            # 2. Breadth: repository count (5 repos = 1.0)
            breadth = min(1.0, repo_count / 5.0)

            # 3. Activity: commit count (200 commits = 1.0)
            if skill_commits > 0:
                activity = min(1.0, math.log10(skill_commits + 1) / 2.3)
            else:
                activity = min(0.2, repo_count * 0.05)

            # 4. Recency: exponential decay with 12-month half-life
            if most_recent_months < 120.0:
                recency = 0.5 ** (most_recent_months / 12.0)
            else:
                recency = 0.1

            # Combined formula v1.0
            raw_score = 100.0 * (
                0.35 * volume +
                0.25 * breadth +
                0.25 * activity +
                0.15 * recency
            )
            final_score = int(min(100, max(5, round(raw_score))))

            # Confidence determination
            if repo_count >= 3 and skill_commits >= 30:
                confidence = "high"
            elif repo_count >= 2 or skill_commits >= 15:
                confidence = "medium"
            else:
                confidence = "low"

            skill_results.append({
                "skill_id": skill_id,
                "name": skill_name,
                "category": category,
                "score": final_score,
                "confidence": confidence,
                "metrics": {
                    "volume": round(volume, 2),
                    "breadth": round(breadth, 2),
                    "activity": round(activity, 2),
                    "recency": round(recency, 2),
                    "repos_count": repo_count,
                    "commits_count": skill_commits,
                    "bytes_count": skill_bytes,
                    "last_active_months_ago": round(most_recent_months, 1),
                },
            })

        # Sort by score descending
        skill_results.sort(key=lambda s: s["score"], reverse=True)

        return {
            "formula_version": FORMULA_VERSION,
            "calculated_at": datetime.now(timezone.utc).isoformat(),
            "is_cold_start": is_cold_start,
            "total_profile_repos": total_profile_repos,
            "total_profile_commits": total_profile_commits,
            "scores": skill_results,
        }
