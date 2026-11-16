"""
SkillForge AI — Authentication & Token Verification

Verifies Firebase ID tokens using Google's public cryptographic certificates.
Does not require a service account private key file.
Provides FastAPI dependency `get_current_user` to secure endpoints.
"""

from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.config import settings

# HTTP request adapter for fetching Google's public certificates
_request_adapter = google_requests.Request()
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)]
) -> dict:
    """
    FastAPI dependency that extracts and validates the Firebase ID token
    from the Authorization header: `Bearer <token>`.

    Verifies the cryptographic signature, expiration, and audience (Firebase Project ID).
    Raises 401 Unauthorized if the token is missing, expired, or invalid.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    if not settings.firebase_project_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="FIREBASE_PROJECT_ID is not configured in backend/.env",
        )

    try:
        # Verify the Firebase ID token using Google's public certs
        decoded = id_token.verify_firebase_token(
            token,
            _request_adapter,
            audience=settings.firebase_project_id,
        )

        # Standardize 'uid' key (Firebase uses 'user_id' or 'sub' in standard JWT claims)
        if "uid" not in decoded:
            decoded["uid"] = decoded.get("user_id") or decoded.get("sub")

        return decoded

    except ValueError as e:
        # Raised on expired token, wrong audience, or bad signature
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
