from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.deps import get_db, require_admin
from backend.app.models import Post
from backend.app.schemas import PostCreate, PostOut, PostUpdate
from backend.app.tagging import get_or_create_tags

router = APIRouter(prefix="/api/posts", tags=["posts"])

PROFILE_POST_TITLE = "__PROFILE__"


@router.get("/", response_model=list[PostOut])
def list_posts(db: Session = Depends(get_db)):
    posts = db.scalars(
        select(Post)
        .where(Post.title != PROFILE_POST_TITLE)
        .order_by(Post.published_at.desc())
    ).all()
    return [
        PostOut(
            id=p.id,
            title=p.title,
            content=p.content,
            created_at=p.created_at,
            published_at=p.published_at,
            tags=[t.name for t in (p.tags or [])],
        )
        for p in posts
    ]


@router.get("/{post_id}", response_model=PostOut)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.scalar(select(Post).where(Post.id == post_id, Post.title != PROFILE_POST_TITLE))
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostOut(
        id=post.id,
        title=post.title,
        content=post.content,
        created_at=post.created_at,
        published_at=post.published_at,
        tags=[t.name for t in (post.tags or [])],
    )


@router.post("/", response_model=PostOut, status_code=201)
def create_post(payload: PostCreate, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    now = dt.datetime.now(dt.timezone.utc)
    post = Post(
        title=payload.title,
        content=payload.content,
        created_at=now,
        published_at=payload.published_at or now,
    )
    post.tags = get_or_create_tags(db, payload.tags)
    db.add(post)
    db.commit()
    db.refresh(post)
    return PostOut(
        id=post.id,
        title=post.title,
        content=post.content,
        created_at=post.created_at,
        published_at=post.published_at,
        tags=[t.name for t in (post.tags or [])],
    )


@router.put("/{post_id}", response_model=PostOut)
def update_post(post_id: int, payload: PostUpdate, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    post = db.scalar(select(Post).where(Post.id == post_id, Post.title != PROFILE_POST_TITLE))
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if payload.title is not None:
        post.title = payload.title
    if payload.content is not None:
        post.content = payload.content
    if payload.published_at is not None:
        post.published_at = payload.published_at
    if payload.tags is not None:
        post.tags = get_or_create_tags(db, payload.tags)

    db.add(post)
    db.commit()
    db.refresh(post)

    return PostOut(
        id=post.id,
        title=post.title,
        content=post.content,
        created_at=post.created_at,
        published_at=post.published_at,
        tags=[t.name for t in (post.tags or [])],
    )


@router.delete("/{post_id}", status_code=204)
def delete_post(post_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    post = db.scalar(select(Post).where(Post.id == post_id, Post.title != PROFILE_POST_TITLE))
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
