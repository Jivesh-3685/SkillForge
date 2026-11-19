"""
Tests for SkillForge AI — Supabase & Database Layer
"""

from app.database import (
    TABLE_COLUMNS,
    _doc_to_payload,
    _row_to_doc,
    check_db_health,
    get_db,
    get_db_provider,
)


def test_table_columns_schema_completeness():
    """Verify all 12 PRD tables are mapped with primary keys and data column."""
    expected_tables = [
        "users",
        "scans",
        "skill_scores",
        "github_analysis",
        "roadmaps",
        "resources",
        "resource_feedback",
        "projects",
        "user_projects",
        "mentor_conversations",
        "oauth_states",
        "resumes",
    ]
    for table in expected_tables:
        assert table in TABLE_COLUMNS, f"Missing table {table} in TABLE_COLUMNS"
        assert "id" in TABLE_COLUMNS[table]
        if table != "oauth_states":
            assert "data" in TABLE_COLUMNS[table]


def test_supabase_payload_and_row_mapping():
    """Verify document to Supabase PostgREST payload and row to document reconstruction."""
    # 1. Document to Payload
    doc = {
        "_id": "6aff276430883d9c9add09f4",
        "firebase_uid": "test_uid_123",
        "email": "test@skillforge.ai",
        "scores": [{"skill_id": "python", "score": 85}],
        "custom_extra_attribute": "preserved_in_jsonb",
    }
    payload = _doc_to_payload("skill_scores", doc)
    assert payload["firebase_uid"] == "test_uid_123"
    assert "data" in payload
    assert payload["data"]["custom_extra_attribute"] == "preserved_in_jsonb"
    assert payload["data"]["scores"] == [{"skill_id": "python", "score": 85}]

    # 2. Row to Document
    row = {
        "id": "11111111-2222-3333-4444-555555555555",
        "firebase_uid": "test_uid_123",
        "email": "test@skillforge.ai",
        "data": {
            "custom_extra_attribute": "preserved_in_jsonb",
            "scores": [{"skill_id": "python", "score": 85}],
        },
    }
    deserialized = _row_to_doc(row)
    assert deserialized is not None
    assert deserialized["firebase_uid"] == "test_uid_123"
    assert deserialized["custom_extra_attribute"] == "preserved_in_jsonb"
    assert deserialized["_id"] == "11111111-2222-3333-4444-555555555555"


def test_users_payload_mapping():
    """Verify user document mappings preserve active_goal and gemini settings."""
    user_doc = {
        "firebase_uid": "firebase_abc_123",
        "email": "user@example.com",
        "display_name": "Test User",
        "active_goal": "ai_engineer",
        "gemini_api_key": "AIzaSyTestKey",
        "gemini_model": "gemini-1.5-flash",
    }
    payload = _doc_to_payload("users", user_doc)
    assert payload["firebase_uid"] == "firebase_abc_123"
    assert payload["email"] == "user@example.com"
    assert payload["active_goal"] == "ai_engineer"
    assert payload["gemini_api_key"] == "AIzaSyTestKey"
    assert payload["data"]["active_goal"] == "ai_engineer"


def test_database_provider_fallback():
    """Verify provider name returns local or supabase cleanly without throwing."""
    provider = get_db_provider()
    assert provider in ("supabase", "local")

    db = get_db()
    assert db is not None
    assert db["users"] is not None
