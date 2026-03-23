from __future__ import annotations

import datetime as dt

from jose import jwt
from passlib.context import CryptContext

ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(*, secret_key: str, subject: str, expires_minutes: int) -> str:
    now = dt.datetime.now(dt.timezone.utc)
    expire = now + dt.timedelta(minutes=expires_minutes)
    payload = {"sub": subject, "iat": int(now.timestamp()), "exp": int(expire.timestamp())}
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def decode_token(*, secret_key: str, token: str) -> dict:
    return jwt.decode(token, secret_key, algorithms=[ALGORITHM])
