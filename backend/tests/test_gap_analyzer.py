"""
Tests for SkillForge AI — Skill Gap Analyzer (FR-04)
"""

import pytest
from app.services.gap_analyzer import GapAnalyzer


@pytest.fixture
def gap_analyzer():
    return GapAnalyzer()


def test_gap_ranking_and_severity(gap_analyzer):
    """Gaps must be labeled by severity and ranked by shortfall * weight."""
    user_scores = [
        {"skill_id": "python", "score": 85},  # Mastered (target: 85)
        {"skill_id": "machine_learning", "score": 40},  # Below target (target: 80, shortfall: 40)
        # LLM missing entirely (target: 80, shortfall: 80)
    ]

    report = gap_analyzer.analyze_gaps(user_scores, "ai_engineer")

    assert report["career_id"] == "ai_engineer"
    assert "match_percentage" in report

    gaps = report["gaps"]
    python_gap = next(g for g in gaps if g["skill_id"] == "python")
    ml_gap = next(g for g in gaps if g["skill_id"] == "machine_learning")
    llm_gap = next(g for g in gaps if g["skill_id"] == "llm_generative_ai")

    assert python_gap["severity"] == "mastered"
    assert python_gap["shortfall"] == 0

    assert ml_gap["severity"] == "below"
    assert ml_gap["shortfall"] == 40

    assert llm_gap["severity"] == "missing"
    assert llm_gap["shortfall"] == 80

    # Unmastered gaps with higher priority should rank higher than mastered ones
    assert gaps[0]["severity"] != "mastered"
    assert gaps[-1]["severity"] == "mastered"
