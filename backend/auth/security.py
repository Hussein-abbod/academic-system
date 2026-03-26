import hashlib
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from config import settings


def _is_legacy_sha256(h: str) -> bool:
    """Detect old SHA-256 hex digest (64 lowercase hex chars)."""
    return len(h) == 64 and all(c in "0123456789abcdef" for c in h.lower())


def hash_password(password: str) -> str:
    """Hash a password using bcrypt directly (avoids passlib 1.7.4 + bcrypt 4.x incompatibility)."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password. Transparently handles legacy SHA-256 hashes."""
    if _is_legacy_sha256(hashed_password):
        # Legacy path: compare against old SHA-256 hash
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
    # bcrypt path: use bcrypt.checkpw directly
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_upgraded_hash(plain_password: str, hashed_password: str) -> Optional[str]:
    """Return a new bcrypt hash if the stored hash is legacy SHA-256, else None.
    Call this after a successful verify_password() to transparently migrate."""
    if _is_legacy_sha256(hashed_password):
        return hash_password(plain_password)
    return None


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create a short-lived JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token. Returns None if invalid or expired."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
