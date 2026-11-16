"""
SkillForge AI — GitHub Integration Routes (FR-02)

- GET    /api/github/connect    -> Return GitHub OAuth authorize URL
- GET    /api/github/callback   -> Complete OAuth code exchange, encrypt & store token
- GET    /api/github/status     -> Return connection state and cached GitHub activity
- DELETE /api/github/disconnect -> Revoke local connection & remove token
- POST   /api/github/rescan     -> Trigger a fresh GitHub data scan
"""

import secrets
import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse

from app.config import settings
from app.auth import get_current_user
from app.database import get_db
from app.services.encryption import encrypt_token, decrypt_token
from app.services.github import GitHubService

router = APIRouter(prefix="/api/github", tags=["GitHub"])


@router.get("/connect")
async def get_github_connect_url(user: dict = Depends(get_current_user)):
    """
    Generate GitHub OAuth authorization URL with a cryptographically secure
    CSRF state parameter tied to the authenticated user.
    """
    if not settings.github_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth is not configured. GITHUB_CLIENT_ID is missing.",
        )

    db = get_db()
    state = secrets.token_urlsafe(32)

    # Store state with 10-minute validity
    await db["oauth_states"].insert_one({
        "state": state,
        "firebase_uid": user["uid"],
        "created_at": datetime.now(timezone.utc),
    })

    authorize_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.github_client_id}"
        f"&redirect_uri={settings.github_redirect_uri}"
        f"&scope=read:user"
        f"&state={state}"
    )

    return {"url": authorize_url}


@router.get("/callback")
async def github_oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
):
    """
    GitHub OAuth callback endpoint.
    Verifies CSRF state, exchanges code for access token on backend,
    encrypts the token at rest using Fernet, and redirects to the frontend.
    """
    db = get_db()

    # Verify state
    state_record = await db["oauth_states"].find_one_and_delete({"state": state})
    if not state_record:
        return RedirectResponse(
            url=f"{settings.frontend_url}?github_error=invalid_state"
        )

    uid = state_record["firebase_uid"]

    # Exchange code for access token
    async with httpx.AsyncClient(timeout=15.0) as client:
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
                "redirect_uri": settings.github_redirect_uri,
            },
        )

        if token_res.status_code != 200:
            return RedirectResponse(
                url=f"{settings.frontend_url}?github_error=token_exchange_failed"
            )

        token_data = token_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            err = token_data.get("error_description", "token_exchange_failed")
            return RedirectResponse(
                url=f"{settings.frontend_url}?github_error={err}"
            )

    # Fetch GitHub user info
    try:
        gh_service = GitHubService(access_token)
        gh_user = await gh_service.get_authenticated_user()
        gh_username = gh_user.get("login")

        # Encrypt token with Fernet
        encrypted_token = encrypt_token(access_token)

        # Update User in MongoDB
        now = datetime.now(timezone.utc)
        await db["users"].update_one(
            {"firebase_uid": uid},
            {
                "$set": {
                    "github_username": gh_username,
                    "github_token_encrypted": encrypted_token,
                    "github_connected_at": now,
                    "updated_at": now,
                }
            },
            upsert=True,
        )

        # Run first-time initial activity scan and cache
        scan_data = await gh_service.scan_user_activity(gh_username)
        await db["github_analysis"].update_one(
            {"firebase_uid": uid},
            {
                "$set": {
                    "firebase_uid": uid,
                    "username": gh_username,
                    "data": scan_data,
                    "scanned_at": now,
                }
            },
            upsert=True,
        )

        return RedirectResponse(url=f"{settings.frontend_url}?github=connected")

    except Exception as e:
        return RedirectResponse(
            url=f"{settings.frontend_url}?github_error={str(e)}"
        )


@router.get("/status")
async def get_github_status(user: dict = Depends(get_current_user)):
    """
    Get the user's current GitHub connection status and cached scan data.
    """
    db = get_db()
    uid = user["uid"]

    user_doc = await db["users"].find_one({"firebase_uid": uid})
    if not user_doc or not user_doc.get("github_token_encrypted"):
        return {
            "connected": False,
            "username": None,
            "analysis": None,
        }

    analysis_doc = await db["github_analysis"].find_one({"firebase_uid": uid})
    return {
        "connected": True,
        "username": user_doc.get("github_username"),
        "connected_at": user_doc.get("github_connected_at"),
        "analysis": analysis_doc.get("data") if analysis_doc else None,
    }


@router.delete("/disconnect")
async def disconnect_github(user: dict = Depends(get_current_user)):
    """
    Disconnect GitHub account, securely delete encrypted token and cached analysis.
    """
    db = get_db()
    uid = user["uid"]

    now = datetime.now(timezone.utc)
    await db["users"].update_one(
        {"firebase_uid": uid},
        {
            "$unset": {
                "github_username": "",
                "github_token_encrypted": "",
                "github_connected_at": "",
            },
            "$set": {"updated_at": now},
        },
    )

    await db["github_analysis"].delete_one({"firebase_uid": uid})

    return {"connected": False, "message": "GitHub account successfully disconnected."}


from app.services.skill_analyzer import SkillAnalyzer, FORMULA_VERSION
import uuid

analyzer = SkillAnalyzer()


@router.post("/rescan")
async def rescan_github(
    force: bool = Query(default=False),
    user: dict = Depends(get_current_user),
):
    """
    Perform a fresh scan of repositories, languages, and commits.
    - Limits to one automatic re-scan per hour unless force=True
    - Computes before/after skill score deltas
    - Records history into append-only scans collection
    """
    db = get_db()
    uid = user["uid"]

    user_doc = await db["users"].find_one({"firebase_uid": uid})
    if not user_doc or not user_doc.get("github_token_encrypted"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No GitHub account connected. Please connect GitHub first.",
        )

    # Check 1-hour rate limit on re-scanning
    analysis_doc = await db["github_analysis"].find_one({"firebase_uid": uid})
    now = datetime.now(timezone.utc)
    if analysis_doc and not force:
        last_scanned = analysis_doc.get("scanned_at")
        if last_scanned and isinstance(last_scanned, datetime):
            elapsed_seconds = (now - last_scanned).total_seconds()
            if elapsed_seconds < 300:  # 5 min grace limit for demo testing
                remaining_min = int((300 - elapsed_seconds) / 60) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Re-scan rate limit: Please wait {remaining_min} more minute(s) before re-scanning.",
                )

    try:
        access_token = decrypt_token(user_doc["github_token_encrypted"])
        username = user_doc["github_username"]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decrypt token. Please reconnect your GitHub account.",
        )

    gh_service = GitHubService(access_token)
    scan_data = await gh_service.scan_user_activity(username)

    # 1. Grab old scores to compute delta
    old_scores_doc = await db["skill_scores"].find_one({"firebase_uid": uid})
    old_scores_map = {}
    if old_scores_doc and "scores" in old_scores_doc:
        old_scores_map = {s["skill_id"]: s.get("score", 0) for s in old_scores_doc["scores"]}

    # 2. Compute new scores
    analysis_result = analyzer.analyze(scan_data)
    new_scores = analysis_result["scores"]
    scan_id = str(uuid.uuid4())

    # 3. Compute skill deltas
    deltas = []
    for s in new_scores:
        s_id = s["skill_id"]
        old_val = old_scores_map.get(s_id, 0)
        diff = s["score"] - old_val
        deltas.append({
            "skill_id": s_id,
            "name": s["name"],
            "category": s["category"],
            "previous_score": old_val,
            "new_score": s["score"],
            "delta": diff,
        })

    # Sort deltas by largest positive gain
    deltas.sort(key=lambda d: d["delta"], reverse=True)

    # 4. Save analysis cache
    await db["github_analysis"].update_one(
        {"firebase_uid": uid},
        {
            "$set": {
                "firebase_uid": uid,
                "username": username,
                "data": scan_data,
                "scanned_at": now,
            }
        },
        upsert=True,
    )

    # 5. Append to scans collection (append-only history for growth tracking)
    await db["scans"].insert_one({
        "scan_id": scan_id,
        "firebase_uid": uid,
        "formula_version": FORMULA_VERSION,
        "created_at": now,
        "repo_count": analysis_result["total_profile_repos"],
        "total_commits": analysis_result["total_profile_commits"],
        "scores": new_scores,
        "deltas": deltas,
    })

    # 6. Update current skill_scores
    await db["skill_scores"].update_one(
        {"firebase_uid": uid},
        {
            "$set": {
                "scan_id": scan_id,
                "firebase_uid": uid,
                "source": "github",
                "formula_version": FORMULA_VERSION,
                "calculated_at": now.isoformat(),
                "is_cold_start": analysis_result["is_cold_start"],
                "scores": new_scores,
            }
        },
        upsert=True,
    )

    return {
        "success": True,
        "scan_id": scan_id,
        "scanned_at": now.isoformat(),
        "analysis": scan_data,
        "deltas": deltas,
        "scores": new_scores,
    }
