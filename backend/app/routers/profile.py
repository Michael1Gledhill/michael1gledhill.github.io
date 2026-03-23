from __future__ import annotations

import datetime as dt
import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.deps import get_current_user, get_db, require_admin
from backend.app.models import Post
from backend.app.routers.posts import PROFILE_POST_TITLE

router = APIRouter(prefix="/api/profile", tags=["profile"])


class ProfileOut(BaseModel):
    about: str
    skills: list[str]
    experience: list[str]


class ProfileUpdate(BaseModel):
    about: str = Field(default="", max_length=5000)
    skills: list[str] = Field(default_factory=list, max_length=200)
    experience: list[str] = Field(default_factory=list, max_length=200)


DEFAULT_PROFILE = {
    "about": "I build clean, fast, developer-friendly experiences.",
    "skills": ["Python", "FastAPI", "React", "TailwindCSS", "SQLite"],
    "experience": ["Shipped web apps", "Built APIs", "Designed UI systems"],
}


def _ensure_profile_row(db: Session) -> Post:
    row = db.scalar(select(Post).where(Post.title == PROFILE_POST_TITLE))
    if row is None:
        row = Post(
            title=PROFILE_POST_TITLE,
            content=json.dumps(DEFAULT_PROFILE),
            created_at=dt.datetime.now(dt.timezone.utc),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


@router.get("/", response_model=ProfileOut)
def get_profile(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    row = _ensure_profile_row(db)
    data = json.loads(row.content or "{}")
    merged = {**DEFAULT_PROFILE, **data}
    return ProfileOut(**merged)


@router.put("/", response_model=ProfileOut)
def update_profile(payload: ProfileUpdate, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    row = _ensure_profile_row(db)
    row.content = json.dumps(payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)

    data = json.loads(row.content or "{}")
    merged = {**DEFAULT_PROFILE, **data}
    return ProfileOut(**merged)
