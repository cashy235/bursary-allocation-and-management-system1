from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
import models
import bcrypt
import hashlib


def _normalized_password_bytes(password: str) -> bytes:
    # Hash to fixed-length bytes so bcrypt never receives >72 bytes.
    return hashlib.sha256(password.encode("utf-8")).hexdigest().encode("ascii")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    hashed = hashed_password.encode("utf-8")
    raw_bytes = plain_password.encode("utf-8")
    candidates = (
        _normalized_password_bytes(plain_password),  # new format
        raw_bytes,                                   # legacy format (if <=72 bytes)
        raw_bytes[:72],                              # legacy fallback
    )
    try:
        for candidate in candidates:
            try:
                if bcrypt.checkpw(candidate, hashed):
                    return True
            except ValueError:
                # Triggered by bcrypt's 72-byte limit for legacy plaintext input.
                continue
        return False
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    hashed = bcrypt.hashpw(_normalized_password_bytes(password), bcrypt.gensalt())
    return hashed.decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def create_tokens(user: models.User) -> tuple[str, str]:
    token_data = {"user_id": user.id, "username": user.username, "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    return access_token, refresh_token