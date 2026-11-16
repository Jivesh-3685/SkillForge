"""
Tests for SkillForge AI — Roadmap Generator (FR-05)
"""

from app.services.roadmap_generator import generate_rule_based_roadmap, RoadmapData


def test_rule_based_roadmap_generation():
    """Fallback generator must reliably produce valid structured weekly plans."""
    ranked_gaps = [
        {"skill_id": "python", "name": "Python", "shortfall": 50, "severity": "below"},
        {"skill_id": "fastapi", "name": "FastAPI", "shortfall": 70, "severity": "missing"},
    ]

    roadmap = generate_rule_based_roadmap(
        career_id="backend_engineer",
        career_title="Backend Systems Engineer",
        ranked_gaps=ranked_gaps,
        weekly_hours=12,
    )

    assert isinstance(roadmap, RoadmapData)
    assert roadmap.total_weeks >= 2
    assert len(roadmap.weeks) >= 2
    assert roadmap.generated_by == "rule_based_fallback"

    for week in roadmap.weeks:
        assert week.week_number > 0
        assert len(week.tasks) > 0
        for task in week.tasks:
            assert task.task_id != ""
            assert task.estimated_hours > 0
            assert task.completed is False
