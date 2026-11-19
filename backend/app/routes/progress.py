"""
SkillForge AI — Progress Dashboard Route (FR-08)

Single aggregate endpoint returning:
- Skill score charts data (for Recharts)
- Roadmap completion percentage and hours
- GitHub commit activity and language breakdown
- Portfolio project completion counts
- Target career readiness score
"""

import asyncio
from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.database import get_db
from app.services.gap_analyzer import GapAnalyzer

router = APIRouter(prefix="/api/progress", tags=["Progress"])
gap_analyzer = GapAnalyzer()


@router.get("")
async def get_progress_dashboard(user: dict = Depends(get_current_user)):
    """
    Returns unified aggregate progress data for the learner's dashboard in a single call.
    Designed for sub-2-second broadband latency.
    """
    db = get_db()
    uid = user["uid"]

    # Concurrently fetch all user records from MongoDB
    user_task = db["users"].find_one({"firebase_uid": uid})
    scores_task = db["skill_scores"].find_one({"firebase_uid": uid})
    roadmap_task = db["roadmaps"].find_one({"firebase_uid": uid})
    projects_task = db["user_projects"].find({"firebase_uid": uid}).to_list(100)
    github_task = db["github_analysis"].find_one({"firebase_uid": uid})

    user_doc, scores_doc, roadmap_doc, user_project_docs, github_doc = await asyncio.gather(
        user_task,
        scores_task,
        roadmap_task,
        projects_task,
        github_task,
    )

    # 1. Career Goal & Readiness
    goal_id = user_doc.get("active_goal", "ai_engineer") if user_doc else "ai_engineer"
    scores_list = scores_doc.get("scores", []) if scores_doc else []
    gap_report = gap_analyzer.analyze_gaps(scores_list, goal_id)

    # 2. Roadmap Progress
    roadmap_progress = {
        "has_roadmap": False,
        "percentage": 0,
        "total_tasks": 0,
        "completed_tasks": 0,
        "total_hours": 0.0,
        "completed_hours": 0.0,
    }
    if roadmap_doc and "weeks" in roadmap_doc:
        total_tasks = 0
        completed_tasks = 0
        total_hours = 0.0
        completed_hours = 0.0
        for w in roadmap_doc.get("weeks", []):
            for t in w.get("tasks", []):
                total_tasks += 1
                h = float(t.get("estimated_hours", 2.0))
                total_hours += h
                if t.get("completed"):
                    completed_tasks += 1
                    completed_hours += h

        pct = round((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0
        roadmap_progress = {
            "has_roadmap": True,
            "percentage": pct,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "total_hours": round(total_hours, 1),
            "completed_hours": round(completed_hours, 1),
            "total_weeks": len(roadmap_doc.get("weeks", [])),
        }

    # 3. Project Stats
    in_prog = sum(1 for p in user_project_docs if p.get("status") == "in_progress")
    comp = sum(1 for p in user_project_docs if p.get("status") == "completed")
    project_stats = {
        "in_progress": in_prog,
        "completed": comp,
        "total_attempted": len(user_project_docs),
    }

    # 4. GitHub Stats & Language Pie Data
    gh_data = github_doc.get("data") if github_doc else None
    languages_pie = []
    total_commits = 0
    repo_count = 0

    if gh_data:
        total_commits = gh_data.get("total_commits", 0)
        repo_count = gh_data.get("repo_count", 0)
        for lang_item in gh_data.get("languages", [])[:5]:
            languages_pie.append({
                "name": lang_item.get("language"),
                "value": lang_item.get("percentage", 0),
            })

    # 5. Skills vs Target Bar Data (for top 6 skills in active career)
    skill_chart_data = []
    target_lookup = {g["skill_id"]: g["target_score"] for g in gap_report.get("gaps", [])}
    user_lookup = {s.get("skill_id"): s.get("score", 0) for s in scores_list if s.get("skill_id")}
    name_lookup = {s.get("name", "").lower(): s.get("score", 0) for s in scores_list if s.get("name")}

    def get_user_score(s_id: str, s_name: str) -> int:
        if s_id in user_lookup:
            return user_lookup[s_id]
        if s_name and s_name.lower() in name_lookup:
            return name_lookup[s_name.lower()]
        return 0

    for gap in gap_report.get("gaps", [])[:6]:
        skill_chart_data.append({
            "skill": gap["name"],
            "current": get_user_score(gap["skill_id"], gap["name"]),
            "target": gap["target_score"],
        })

    # 6. Scatter Graph Data: (Current Verified Score vs Target Requirement Score)
    scatter_data = []
    for gap in gap_report.get("gaps", []):
        cur = get_user_score(gap["skill_id"], gap["name"])
        tgt = gap.get("target_score", 80)
        shortfall = max(0, tgt - cur)
        scatter_data.append({
            "name": gap["name"],
            "current": cur,
            "target": tgt,
            "shortfall": shortfall,
            "weight": gap.get("weight", 1.0),
            "severity": gap.get("severity", "below"),
            "status": "Mastered" if cur >= tgt else ("Critical Gap" if shortfall >= 30 else "Moderate Gap"),
        })

    # 7. Timeline / Line Graph Data: Historical progress or milestone trajectory
    scans_cursor = db["scans"].find({"firebase_uid": uid}).sort("created_at", 1)
    scan_docs = await scans_cursor.to_list(10)

    timeline_points = []
    tracked_skill_names = [g["name"] for g in gap_report.get("gaps", [])[:4]]
    if not tracked_skill_names:
        tracked_skill_names = ["Python", "FastAPI", "Docker", "SQL Databases"]

    if len(scan_docs) >= 2:
        for idx, s in enumerate(scan_docs):
            created = s.get("created_at")
            lbl = f"Scan #{idx + 1}"
            pt = {"label": lbl}
            s_map = {item["name"]: item["score"] for item in s.get("scores", [])}
            for name in tracked_skill_names:
                pt[name] = s_map.get(name, 0)
            timeline_points.append(pt)
    else:
        # Generate progressive learning timeline based on current scores and active roadmap
        current_map = {s.get("name"): s.get("score", 0) for s in scores_list}
        stages = ["Baseline", "Phase 1", "Phase 2", "Current State", "Target Goal"]
        for idx, stage in enumerate(stages):
            ratio = idx / (len(stages) - 1)
            pt = {"label": stage}
            for name in tracked_skill_names:
                cur_val = current_map.get(name, 15 + idx * 5)
                target_val = 85
                if idx == 0:
                    val = max(5, int(cur_val * 0.4))
                elif idx == 1:
                    val = max(10, int(cur_val * 0.7))
                elif idx == 2:
                    val = max(15, int(cur_val * 0.9))
                elif idx == 3:
                    val = cur_val
                else:
                    val = target_val
                pt[name] = min(100, val)
            timeline_points.append(pt)

    return {
        "career_id": goal_id,
        "career_title": gap_report.get("career_title"),
        "match_readiness_percentage": gap_report.get("match_percentage", 0),
        "gap_summary": gap_report.get("summary", {}),
        "roadmap": roadmap_progress,
        "projects": project_stats,
        "github": {
            "connected": bool(user_doc and user_doc.get("github_username")),
            "username": user_doc.get("github_username") if user_doc else None,
            "total_commits": total_commits,
            "repo_count": repo_count,
            "languages": languages_pie,
        },
        "chart_data": {
            "skills": skill_chart_data,
            "languages": languages_pie,
            "scatter": scatter_data,
            "timeline": timeline_points,
            "tracked_skills": tracked_skill_names,
        },
    }
