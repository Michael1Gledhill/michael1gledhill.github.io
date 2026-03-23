from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from backend.app.config import Settings
from backend.app.db import create_engine_from_url, create_sessionmaker
from backend.app.models import Base, User
from backend.app.routers import admin, auth, photos, posts, profile
from backend.app.security import hash_password, verify_password


def _ensure_default_admin(app: FastAPI) -> None:
    session_local = app.state.SessionLocal
    settings: Settings = app.state.settings

    if not settings.bootstrap_admin:
        return

    db = session_local()
    try:
        # If an admin already exists, do nothing.
        existing_admin = db.scalar(select(User).where(User.is_admin.is_(True)))
        if existing_admin is not None:
            return

        # No admin exists — create or promote the configured default admin user.
        existing = db.scalar(select(User).where(User.username == settings.default_admin_username))
        if existing is None:
            user = User(
                username=settings.default_admin_username,
                password_hash=hash_password(settings.default_admin_password),
                email="admin@example.com",
                phone="000-000-0000",
                receive_emails=False,
                is_verified=True,
                is_admin=True,
            )
            db.add(user)
            db.commit()
            return

        # Promote an existing user (e.g. if someone signed up as "admin" earlier).
        existing.is_verified = True
        existing.is_admin = True

        if settings.reset_bootstrap_admin_password:
            # Avoid unnecessary re-hashing if it already matches.
            if not verify_password(settings.default_admin_password, existing.password_hash):
                existing.password_hash = hash_password(settings.default_admin_password)

        db.commit()
    finally:
        db.close()


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()

    engine = create_engine_from_url(settings.db_url)
    SessionLocal = create_sessionmaker(engine)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Create schema
        Base.metadata.create_all(bind=engine)

        app.state.settings = settings
        app.state.engine = engine
        app.state.SessionLocal = SessionLocal

        _ensure_default_admin(app)

        # Ensure uploads folder exists
        os.makedirs(os.path.join("backend", "uploads", "photos"), exist_ok=True)

        yield

    # StaticFiles requires the directory to exist at mount time.
    os.makedirs(os.path.join("backend", "uploads", "photos"), exist_ok=True)

    app = FastAPI(title="Portfolio Hub API", version="1.0.0", lifespan=lifespan)

    origins = settings.cors_origin_list
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins != ["*"] else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(admin.router)
    app.include_router(posts.router)
    app.include_router(profile.router)
    app.include_router(photos.router)

    # Static serving for uploads (photos)
    app.mount("/uploads", StaticFiles(directory=os.path.join("backend", "uploads")), name="uploads")

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
