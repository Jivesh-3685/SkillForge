"""
SkillForge AI — Token Encryption Service

Encrypts and decrypts GitHub OAuth access tokens at rest using Fernet.
Ensures raw tokens are never saved as plaintext in the database.
"""

from cryptography.fernet import Fernet
from app.config import settings

_fernet = None


def get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        if not settings.fernet_key:
            raise ValueError("FERNET_KEY is not configured in settings/.env")
        _fernet = Fernet(settings.fernet_key.encode())
    return _fernet


def encrypt_token(token: str) -> str:
    """Encrypt a plaintext token string to an encrypted ascii string."""
    f = get_fernet()
    return f.encrypt(token.encode()).decode()


def decrypt_token(encrypted_token: str) -> str:
    """Decrypt an encrypted token string back to plaintext."""
    f = get_fernet()
    return f.decrypt(encrypted_token.encode()).decode()
