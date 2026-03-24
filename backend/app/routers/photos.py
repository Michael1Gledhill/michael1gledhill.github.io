from __future__ import annotations

import datetime as dt
import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.config import Settings
from backend.app.deps import get_current_user, get_db, get_settings, require_admin
from backend.app.models import Photo
from backend.app.schemas import PhotoOut

router = APIRouter(prefix="/api/photos", tags=["photos"])


def _abs_path_from_rel(settings: Settings, rel_path: str) -> str:
    # rel_path is stored like: 'uploads/photos/<file>'
    p = (rel_path or "").lstrip("/")
    if not p.startswith("uploads/"):
        raise HTTPException(status_code=500, detail="Invalid stored file path")
    sub = p[len("uploads/") :]
    return os.path.join(settings.uploads_dir, sub.replace("/", os.sep))


def _ensure_upload_dir(settings: Settings) -> None:
    os.makedirs(os.path.join(settings.uploads_dir, "photos"), exist_ok=True)


@router.get("/", response_model=list[PhotoOut])
def list_photos(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    photos = db.scalars(select(Photo).order_by(Photo.uploaded_at.desc())).all()
    return [PhotoOut(id=p.id, file_path=p.file_path, uploaded_at=p.uploaded_at) for p in photos]


@router.post("/", response_model=PhotoOut, status_code=201)
def upload_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
    settings: Settings = Depends(get_settings),
):
    _ensure_upload_dir(settings)

    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    safe_name = f"{uuid.uuid4().hex}{ext}"
    rel_path = f"uploads/photos/{safe_name}"
    abs_path = _abs_path_from_rel(settings, rel_path)

    # Save file
    with open(abs_path, "wb") as f:
        f.write(file.file.read())

    photo = Photo(file_path=rel_path, uploaded_at=dt.datetime.now(dt.timezone.utc))
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return PhotoOut(id=photo.id, file_path=photo.file_path, uploaded_at=photo.uploaded_at)


@router.delete("/{photo_id}", status_code=204)
def delete_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
    settings: Settings = Depends(get_settings),
):
    photo = db.scalar(select(Photo).where(Photo.id == photo_id))
    if photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Best-effort file delete.
    abs_path = _abs_path_from_rel(settings, photo.file_path)
    if os.path.exists(abs_path):
        try:
            os.remove(abs_path)
        except OSError:
            pass

    db.delete(photo)
    db.commit()
