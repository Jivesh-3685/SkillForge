"""
Tests for SkillForge AI — Skill Analyzer (FR-03)
"""

import pytest
from app.services.skill_analyzer import SkillAnalyzer, FORMULA_VERSION


@pytest.fixture
def analyzer():
    return SkillAnalyzer()


def test_analyzer_determinism(analyzer):
    """The same input must always produce the exact same output score."""
    scan_data = {
        "repo_count": 4,
        "total_commits": 60,
        "repositories": [
            {
                "name": "fastapi-service",
                "description": "FastAPI REST microservice in Python",
                "primary_language": "Python",
                "languages": {"Python": 150000},
                "commits": 35,
                "updated_at": "2026-11-01T00:00:00Z",
            },
            {
                "name": "ml-pipeline",
                "description": "Machine learning scikit-learn models",
                "primary_language": "Python",
                "languages": {"Python": 200000},
                "commits": 25,
                "updated_at": "2026-10-15T00:00:00Z",
            },
        ],
    }

    run1 = analyzer.analyze(scan_data)
    run2 = analyzer.analyze(scan_data)

    assert run1["formula_version"] == FORMULA_VERSION
    assert run1["scores"] == run2["scores"]
    assert len(run1["scores"]) > 0


def test_cold_start_detection(analyzer):
    """Learners with < 3 non-fork repos or < 30 commits must be flagged as cold-start."""
    low_activity_scan = {
        "repo_count": 1,
        "total_commits": 10,
        "repositories": [
            {
                "name": "hello-world",
                "description": "First repo",
                "primary_language": "Python",
                "languages": {"Python": 1000},
                "commits": 10,
                "updated_at": "2026-11-01T00:00:00Z",
            }
        ],
    }

    result = analyzer.analyze(low_activity_scan)
    assert result["is_cold_start"] is True


def test_confidence_tiers(analyzer):
    """High confidence requires >= 3 repos and >= 30 commits."""
    high_activity_scan = {
        "repo_count": 3,
        "total_commits": 45,
        "repositories": [
            {
                "name": "repo1",
                "description": "Python project 1",
                "primary_language": "Python",
                "languages": {"Python": 50000},
                "commits": 15,
                "updated_at": "2026-11-01T00:00:00Z",
            },
            {
                "name": "repo2",
                "description": "Python project 2",
                "primary_language": "Python",
                "languages": {"Python": 50000},
                "commits": 15,
                "updated_at": "2026-10-01T00:00:00Z",
            },
            {
                "name": "repo3",
                "description": "Python project 3",
                "primary_language": "Python",
                "languages": {"Python": 50000},
                "commits": 15,
                "updated_at": "2026-09-01T00:00:00Z",
            },
        ],
    }

    result = analyzer.analyze(high_activity_scan)
    python_skill = next((s for s in result["scores"] if s["skill_id"] == "python"), None)

    assert python_skill is not None
    assert python_skill["confidence"] == "high"
    assert python_skill["score"] >= 60
