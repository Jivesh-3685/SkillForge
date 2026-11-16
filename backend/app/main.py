"""
SkillForge AI — FastAPI Application

Entry point for the backend.
- Mounts CORS (frontend origin only)
- Connects to MongoDB on startup
- Exposes /api/health for the walking-skeleton check
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import connect_db, close_db, check_db_health
from app.routes.auth import router as auth_router
from app.routes.github import router as github_router
from app.routes.skills import router as skills_router
from app.routes.goals import router as goals_router
from app.routes.roadmap import router as roadmap_router
from app.routes.resources import router as resources_router
from app.routes.projects import router as projects_router
from app.routes.progress import router as progress_router
from app.routes.mentor import router as mentor_router
from app.routes.resume import router as resume_router


# ── Lifespan (startup / shutdown) ────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Connect to MongoDB on startup, close on shutdown."""
    await connect_db()
    yield
    await close_db()


# ── App instance ─────────────────────────────────────────
app = FastAPI(
    title="SkillForge AI",
    description="GitHub-verified AI learning mentor API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS — only allow the configured frontend origin ─────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ──────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(github_router)
app.include_router(skills_router)
app.include_router(goals_router)
app.include_router(roadmap_router)
app.include_router(resources_router)
app.include_router(projects_router)
app.include_router(progress_router)
app.include_router(mentor_router)
app.include_router(resume_router)


# ── Health endpoint ──────────────────────────────────────
@app.get("/api/health", tags=["System"])
async def health_check():
    """
    Walking-skeleton health check.

    Returns the status of the backend and its MongoDB connection.
    The frontend calls this to display green/red indicators.
    """
    db_ok = await check_db_health()
    return {
        "status": "ok" if db_ok else "degraded",
        "backend": True,
        "database": db_ok,
        "version": app.version,
    }
