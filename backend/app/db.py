from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def create_engine_from_url(db_url: str):
    # Needed for SQLite threading with FastAPI.
    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}

    return create_engine(db_url, connect_args=connect_args, future=True)


def create_sessionmaker(engine):
    return sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)
