"""
SkillForge AI — MongoDB Connection

Async MongoDB client using Motor.
Provides a shared database handle and a health-check helper.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# ── Client & database handle ────────────────────────────
_client: AsyncIOMotorClient | None = None
_db = None


async def connect_db() -> None:
    """Open the MongoDB connection pool (called once at startup)."""
    global _client, _db
    _client = AsyncIOMotorClient(settings.mongodb_uri)
    _db = _client[settings.mongodb_db_name]


async def close_db() -> None:
    """Drain the connection pool (called once at shutdown)."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None


def get_db():
    """Return the active database handle. Raises if not connected."""
    if _db is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _db


async def check_db_health() -> bool:
    """Ping MongoDB and return True if reachable."""
    try:
        if _client is None:
            return False
        await _client.admin.command("ping")
        return True
    except Exception:
        return False
