from __future__ import annotations

import datetime as dt
import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.config import Settings
from backend.app.deps import (
    get_db,
    get_settings,
    require_admin,
)
from backend.app.models import Photo
from backend.app.schemas import PhotoAdminPatch, PhotoOut
from backend.app.tagging import get_or_create_tags

router = APIRouter(prefix="/api/photos", tags=["photos"])


def _abs_path_from_rel(settings: Settings, rel_path: str) -> str:
    # rel_path is stored like: 'uploads/photos/<file>'
    p = (rel_path or "").lstrip("/")
    if not p.startswith("uploads/"):
        raise HTTPException(status_code=500, detail="Invalid stored file path")
    sub = p[len("uploads/"):]
    return os.path.join(settings.uploads_dir, sub.replace("/", os.sep))


def _ensure_upload_dir(settings: Settings) -> None:
    os.makedirs(
        os.path.join(settings.uploads_dir, "photos"),
        exist_ok=True,
    )


@router.get("/", response_model=list[PhotoOut])
def list_photos(
    db: Session = Depends(get_db),
):
    photos = db.scalars(select(Photo).order_by(Photo.taken_at.desc())).all()
    return [
        PhotoOut(
            id=p.id,
            file_path=p.file_path,
            uploaded_at=p.uploaded_at,
            taken_at=p.taken_at,
            post_id=p.post_id,
            tags=[t.name for t in (p.tags or [])],
        )
        for p in photos
    ]


@router.post("/", response_model=PhotoOut, status_code=201)
def upload_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
    settings: Settings = Depends(get_settings),
):
    now = dt.datetime.now(dt.timezone.utc)
    use_cloudinary = bool(settings.cloudinary_url)
    if not use_cloudinary:
        _ensure_upload_dir(settings)

    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type",
        )

    if use_cloudinary:
        try:
            import cloudinary
            import cloudinary.uploader
        except Exception:
            msg = "Cloudinary configured but Python package missing"
            raise HTTPException(
                status_code=500,
                detail=msg,
            )

        cloudinary.config(
            cloudinary_url=settings.cloudinary_url,
        )

        data = file.file.read()
        if not data:
            raise HTTPException(
                status_code=400,
                detail="Empty upload",
            )

        # Cloudinary assigns a public_id; we store it in storage_key for
        # deletes.
        result = cloudinary.uploader.upload(
            data,
            folder=settings.cloudinary_folder,
            resource_type="image",
            overwrite=False,
        )

        url = result.get("secure_url")
        public_id = result.get("public_id")
        if not url or not public_id:
            raise HTTPException(status_code=502, detail="Cloud upload failed")

        photo = Photo(
            file_path=str(url),
            storage_key=str(public_id),
            uploaded_at=now,
            taken_at=now,
        )
    else:
        safe_name = f"{uuid.uuid4().hex}{ext}"
        rel_path = f"uploads/photos/{safe_name}"
        abs_path = _abs_path_from_rel(settings, rel_path)

        # Save file
        with open(abs_path, "wb") as f:
            f.write(file.file.read())

        photo = Photo(file_path=rel_path, uploaded_at=now, taken_at=now)
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return PhotoOut(
        id=photo.id,
        file_path=photo.file_path,
        uploaded_at=photo.uploaded_at,
        taken_at=photo.taken_at,
        post_id=photo.post_id,
        tags=[t.name for t in (photo.tags or [])],
    )


@router.patch("/{photo_id}", response_model=PhotoOut)
def patch_photo(
    photo_id: int,
    payload: PhotoAdminPatch,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    photo = db.scalar(select(Photo).where(Photo.id == photo_id))
    if photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")

    fields_set = payload.model_fields_set

    if "taken_at" in fields_set:
        photo.taken_at = payload.taken_at

    # Allow clearing the link by explicitly passing null.
    if "post_id" in fields_set:
        photo.post_id = payload.post_id

    # Allow clearing tags by explicitly passing null.
    if "tags" in fields_set:
        photo.tags = get_or_create_tags(db, payload.tags or [])

    db.add(photo)
    db.commit()
    db.refresh(photo)

    return PhotoOut(
        id=photo.id,
        file_path=photo.file_path,
        uploaded_at=photo.uploaded_at,
        taken_at=photo.taken_at,
        post_id=photo.post_id,
        tags=[t.name for t in (photo.tags or [])],
    )


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

    # Best-effort delete.
    if photo.storage_key and settings.cloudinary_url:
        try:
            import cloudinary
            import cloudinary.uploader

            cloudinary.config(cloudinary_url=settings.cloudinary_url)
            cloudinary.uploader.destroy(
                photo.storage_key,
                resource_type="image",
            )
        except Exception:
            # Ignore storage errors; DB entry still removed.
            pass
    else:
        abs_path = _abs_path_from_rel(settings, photo.file_path)
        if os.path.exists(abs_path):
            try:
                os.remove(abs_path)
            except OSError:
                pass

    db.delete(photo)
    db.commit()
