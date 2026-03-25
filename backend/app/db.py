from __future__ import annotations

import ipaddress
import socket

from sqlalchemy import create_engine
from sqlalchemy import inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker


def create_engine_from_url(db_url: str, *, prefer_ipv4: bool = True):
    # Normalize managed Postgres URLs to an explicit SQLAlchemy driver.
    # Many providers hand out `postgres://` or `postgresql://` URLs.
    if db_url.startswith("postgres://"):
        db_url = "postgresql+psycopg://" + db_url[len("postgres://") :]
    elif db_url.startswith("postgresql://") and "+" not in db_url.split("://", 1)[0]:
        db_url = "postgresql+psycopg://" + db_url[len("postgresql://") :]

    # Needed for SQLite threading with FastAPI.
    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}

    # Prefer IPv4 for Postgres connections when possible.
    # This avoids failures like: "connection to server at \"2600:...\" failed:
    # Network is unreachable" when the environment has no IPv6 egress.
    if prefer_ipv4 and db_url.startswith("postgresql"):
        try:
            url = make_url(db_url)
            host = url.host
            port = url.port or 5432
            if host:
                try:
                    # If it's already an IP (v4 or v6), don't override.
                    ipaddress.ip_address(host)
                except ValueError:
                    infos = socket.getaddrinfo(
                        host,
                        port,
                        family=socket.AF_INET,
                        type=socket.SOCK_STREAM,
                    )
                    if infos:
                        ipv4 = infos[0][4][0]
                        connect_args = {**connect_args, "hostaddr": ipv4}
        except Exception:
            # If resolution fails for any reason, fall back to default behavior.
            pass

    return create_engine(db_url, connect_args=connect_args, future=True)


def ensure_schema(engine) -> None:
    """Apply tiny, safe schema upgrades without a full migrations framework."""

    inspector = inspect(engine)
    if not inspector.has_table("photos"):
        return

    cols = {c["name"] for c in inspector.get_columns("photos")}
    if "storage_key" not in cols:
        with engine.begin() as conn:
            conn.execute(
                text("ALTER TABLE photos ADD COLUMN storage_key VARCHAR(500)")
            )


def create_sessionmaker(engine):
    return sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)
