"""
SkillForge AI — Demo Profile Seeder
Seeds realistic test profiles into MongoDB Atlas for instant testing & presentation.

Usage:
  cd backend
  python scripts/seed_demo.py
"""

import asyncio
import sys
import uuid
from pathlib import Path
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.database import connect_db, close_db, get_db

DEMO_PROFILES = [
    {
        "firebase_uid": "demo_ai_learner_001",
        "email": "demo.learner@skillforge.ai",
        "displayName": "Demo AI Learner",
        "photoURL": "https://api.dicebear.com/7.x/bottts/svg?seed=DemoAI",
        "target_career": "ai_engineer",
        "weekly_hours": 10,
        "is_cold_start": False,
        "total_repos": 8,
        "total_commits": 142,
        "scores": [
            {
                "skill_id": "python",
                "name": "Python",
                "category": "Languages",
                "score": 85,
                "confidence": "high",
                "metrics": {"volume": 80, "breadth": 75, "activity": 90, "recency": 95, "repos_count": 6, "commits_count": 92}
            },
            {
                "skill_id": "git",
                "name": "Git & Version Control",
                "category": "DevOps & Tools",
                "score": 75,
                "confidence": "high",
                "metrics": {"volume": 70, "breadth": 70, "activity": 80, "recency": 85, "repos_count": 8, "commits_count": 142}
            },
            {
                "skill_id": "fastapi",
                "name": "FastAPI",
                "category": "Backend",
                "score": 68,
                "confidence": "medium",
                "metrics": {"volume": 60, "breadth": 65, "activity": 70, "recency": 80, "repos_count": 3, "commits_count": 35}
            },
            {
                "skill_id": "machine_learning",
                "name": "Machine Learning",
                "category": "AI / ML",
                "score": 45,
                "confidence": "medium",
                "metrics": {"volume": 40, "breadth": 45, "activity": 50, "recency": 55, "repos_count": 2, "commits_count": 20}
            },
            {
                "skill_id": "sql_databases",
                "name": "SQL & Relational DBs",
                "category": "Databases",
                "score": 50,
                "confidence": "medium",
                "metrics": {"volume": 45, "breadth": 50, "activity": 50, "recency": 60, "repos_count": 2, "commits_count": 18}
            },
            {
                "skill_id": "docker",
                "name": "Docker & Containers",
                "category": "DevOps & Tools",
                "score": 30,
                "confidence": "low",
                "metrics": {"volume": 25, "breadth": 30, "activity": 35, "recency": 40, "repos_count": 1, "commits_count": 8}
            }
        ]
    },
    {
        "firebase_uid": "demo_fullstack_002",
        "email": "demo.fullstack@skillforge.ai",
        "displayName": "Demo Full-Stack Dev",
        "photoURL": "https://api.dicebear.com/7.x/bottts/svg?seed=DemoFS",
        "target_career": "fullstack_dev",
        "weekly_hours": 12,
        "is_cold_start": False,
        "total_repos": 12,
        "total_commits": 280,
        "scores": [
            {
                "skill_id": "javascript",
                "name": "JavaScript",
                "category": "Languages",
                "score": 88,
                "confidence": "high",
                "metrics": {"volume": 85, "breadth": 85, "activity": 90, "recency": 95, "repos_count": 10, "commits_count": 160}
            },
            {
                "skill_id": "typescript",
                "name": "TypeScript",
                "category": "Languages",
                "score": 80,
                "confidence": "high",
                "metrics": {"volume": 75, "breadth": 80, "activity": 85, "recency": 90, "repos_count": 5, "commits_count": 75}
            },
            {
                "skill_id": "react",
                "name": "React",
                "category": "Frontend",
                "score": 82,
                "confidence": "high",
                "metrics": {"volume": 80, "breadth": 80, "activity": 85, "recency": 90, "repos_count": 6, "commits_count": 90}
            },
            {
                "skill_id": "html_css",
                "name": "HTML & CSS",
                "category": "Frontend",
                "score": 75,
                "confidence": "high",
                "metrics": {"volume": 70, "breadth": 75, "activity": 80, "recency": 85, "repos_count": 8, "commits_count": 110}
            },
            {
                "skill_id": "nodejs",
                "name": "Node.js",
                "category": "Backend",
                "score": 65,
                "confidence": "medium",
                "metrics": {"volume": 60, "breadth": 65, "activity": 70, "recency": 75, "repos_count": 4, "commits_count": 45}
            },
            {
                "skill_id": "mongodb",
                "name": "MongoDB & NoSQL",
                "category": "Databases",
                "score": 60,
                "confidence": "medium",
                "metrics": {"volume": 55, "breadth": 60, "activity": 65, "recency": 70, "repos_count": 3, "commits_count": 30}
            }
        ]
    }
]

async def seed():
    print("Connecting to MongoDB Atlas...")
    await connect_db()
    db = get_db()
    now = datetime.now(timezone.utc)

    for p in DEMO_PROFILES:
        uid = p["firebase_uid"]
        print(f"Seeding profile: {p['displayName']} ({uid})...")

        # 1. Users collection
        await db["users"].update_one(
            {"firebase_uid": uid},
            {
                "$set": {
                    "firebase_uid": uid,
                    "email": p["email"],
                    "displayName": p["displayName"],
                    "photoURL": p["photoURL"],
                    "github_username": uid,
                    "created_at": now.isoformat(),
                    "updated_at": now.isoformat(),
                }
            },
            upsert=True
        )

        # 2. Skill scores collection
        scan_id = str(uuid.uuid4())
        await db["skill_scores"].update_one(
            {"firebase_uid": uid},
            {
                "$set": {
                    "scan_id": scan_id,
                    "firebase_uid": uid,
                    "source": "github",
                    "formula_version": "v1.0",
                    "calculated_at": now.isoformat(),
                    "is_cold_start": p["is_cold_start"],
                    "scores": p["scores"]
                }
            },
            upsert=True
        )

        # 3. Active career goal
        await db["goals"].update_one(
            {"firebase_uid": uid, "career_id": p["target_career"]},
            {
                "$set": {
                    "firebase_uid": uid,
                    "career_id": p["target_career"],
                    "weekly_hours": p["weekly_hours"],
                    "is_active": True,
                    "created_at": now.isoformat(),
                }
            },
            upsert=True
        )

        # 4. Initial historical scan
        await db["scans"].insert_one({
            "scan_id": scan_id,
            "firebase_uid": uid,
            "formula_version": "v1.0",
            "created_at": now,
            "is_cold_start": p["is_cold_start"],
            "repo_count": p["total_repos"],
            "total_commits": p["total_commits"],
            "scores_summary": {s["skill_id"]: s["score"] for s in p["scores"]}
        })

    print("Demo profiles seeded successfully!")
    await close_db()

if __name__ == "__main__":
    asyncio.run(seed())
