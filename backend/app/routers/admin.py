from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.deps import get_db, require_admin
from backend.app.models import User
from backend.app.schemas import UserAdminPatch, UserOut

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    users = db.scalars(select(User).order_by(User.id.asc())).all()
    return [
        UserOut(
            id=u.id,
            username=u.username,
            email=u.email,
            phone=u.phone,
            receive_emails=u.receive_emails,
            is_verified=u.is_verified,
            is_admin=u.is_admin,
        )
        for u in users
    ]


@router.patch("/users/{user_id}", response_model=UserOut)
def patch_user(user_id: int, payload: UserAdminPatch, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    user = db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.is_verified is not None:
        user.is_verified = payload.is_verified

    if payload.is_admin is not None:
        user.is_admin = payload.is_admin

    db.add(user)
    db.commit()
    db.refresh(user)

    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        phone=user.phone,
        receive_emails=user.receive_emails,
        is_verified=user.is_verified,
        is_admin=user.is_admin,
    )
