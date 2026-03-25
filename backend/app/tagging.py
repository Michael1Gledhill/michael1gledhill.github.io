from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models import Tag


def normalize_tag(name: str) -> str:
    # Keep tags user-friendly and stable.
    # - trim whitespace
    # - collapse internal whitespace to single spaces
    # - lowercase
    cleaned = " ".join((name or "").strip().split())
    return cleaned.lower()


def get_or_create_tags(db: Session, names: list[str]) -> list[Tag]:
    normalized = [normalize_tag(n) for n in (names or [])]
    normalized = [n for n in normalized if n]
    # Deduplicate while preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for n in normalized:
        if n in seen:
            continue
        seen.add(n)
        unique.append(n)

    if not unique:
        return []

    existing = db.scalars(select(Tag).where(Tag.name.in_(unique))).all()
    by_name = {t.name: t for t in existing}

    out: list[Tag] = []
    for n in unique:
        t = by_name.get(n)
        if t is None:
            t = Tag(name=n)
            db.add(t)
            # flush so it has an id if needed later in the same transaction
            db.flush()
            by_name[n] = t
        out.append(t)

    return out
