"""
SkillForge AI — Application Configuration

Loads all settings from environment variables via pydantic-settings.
Every external key and connection string lives here, never in code.
"""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # ── Supabase (Primary Database per PRD) ──────────────
    supabase_url: str = Field(
        default="",
        description="Supabase project URL (e.g. https://xyz.supabase.co)"
    )
    supabase_key: str = Field(
        default="",
        description="Supabase anon public key or service_role key"
    )
    supabase_service_role_key: str = Field(
        default="",
        description="Optional Supabase service_role key to bypass RLS"
    )
    database_type: str = Field(
        default="supabase",
        description="Database provider: 'supabase' (default) or 'local' or 'mongodb'"
    )

    # ── MongoDB (Fallback/Legacy) ────────────────────────
    mongodb_uri: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection URI"
    )
    mongodb_db_name: str = Field(
        default="skillforge",
        description="MongoDB database name"
    )

    # ── Firebase ─────────────────────────────────────────
    firebase_project_id: str = Field(
        default="",
        description="Firebase project ID for auth token verification"
    )

    # ── GitHub OAuth ─────────────────────────────────────
    github_client_id: str = Field(default="")
    github_client_secret: str = Field(default="")
    github_redirect_uri: str = Field(
        default="http://localhost:8000/api/github/callback"
    )

    # ── Gemini API ───────────────────────────────────────
    gemini_api_key: str = Field(default="")

    # ── App ──────────────────────────────────────────────
    frontend_url: str = Field(
        default="http://localhost:5173",
        description="Frontend origin for CORS"
    )
    backend_url: str = Field(default="http://localhost:8000")
    secret_key: str = Field(default="change-me-in-production")
    fernet_key: str = Field(
        default="",
        description="Fernet encryption key for GitHub tokens at rest"
    )

    # ── Optional ─────────────────────────────────────────
    youtube_api_key: str = Field(default="")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


# Singleton — import this everywhere
settings = Settings()
