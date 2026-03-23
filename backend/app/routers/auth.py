from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.config import Settings
from backend.app.deps import get_db, get_settings
from backend.app.models import User
from backend.app.schemas import LoginIn, Message, SignupIn, TokenOut, UserOut
from backend.app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=Message, status_code=201)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where((User.username == payload.username) | (User.email == payload.email)))
    if existing is not None:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        email=str(payload.email),
        phone=payload.phone,
        receive_emails=payload.receive_emails,
        is_verified=False,
        is_admin=False,
    )
    db.add(user)
    db.commit()

    return Message(message="Your account is pending approval. An admin will verify your account.")


@router.post("/login", response_model=TokenOut)
def login(
    payload: LoginIn,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    user = db.scalar(select(User).where(User.username == payload.username))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Account pending admin approval")

    token = create_access_token(
        secret_key=settings.secret_key,
        subject=str(user.id),
        expires_minutes=settings.access_token_exp_minutes,
    )

    return TokenOut(
        access_token=token,
        user=UserOut(
            id=user.id,
            username=user.username,
            email=user.email,
            phone=user.phone,
            receive_emails=user.receive_emails,
            is_verified=user.is_verified,
            is_admin=user.is_admin,
        ).model_dump(),
    )
