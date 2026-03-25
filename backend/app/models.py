from __future__ import annotations

import datetime as dt

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


post_tags = Table(
    "post_tags",
    Base.metadata,
    Column(
        "post_id",
        Integer,
        ForeignKey("posts.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        Integer,
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


photo_tags = Table(
    "photo_tags",
    Base.metadata,
    Column(
        "photo_id",
        Integer,
        ForeignKey("photos.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        Integer,
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    receive_emails: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime,
        default=lambda: dt.datetime.now(dt.timezone.utc),
        nullable=False,
    )

    # The date shown for the post (defaults to creation time, but editable).
    published_at: Mapped[dt.datetime] = mapped_column(
        DateTime,
        default=lambda: dt.datetime.now(dt.timezone.utc),
        nullable=False,
    )

    tags: Mapped[list["Tag"]] = relationship(
        secondary=post_tags,
        back_populates="posts",
        lazy="selectin",
    )

    photos: Mapped[list["Photo"]] = relationship(
        back_populates="post",
        lazy="selectin",
    )


class Photo(Base):
    __tablename__ = "photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    # For external storage providers (e.g. Cloudinary public_id). Optional.
    storage_key: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # The date the photo should be grouped under (defaults to upload time, but editable).
    taken_at: Mapped[dt.datetime] = mapped_column(
        DateTime,
        default=lambda: dt.datetime.now(dt.timezone.utc),
        nullable=False,
    )

    # Optional link to a journal post.
    post_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("posts.id", ondelete="SET NULL"),
        nullable=True,
    )

    post: Mapped[Post | None] = relationship(
        back_populates="photos",
        lazy="selectin",
    )

    tags: Mapped[list["Tag"]] = relationship(
        secondary=photo_tags,
        back_populates="photos",
        lazy="selectin",
    )
    uploaded_at: Mapped[dt.datetime] = mapped_column(
        DateTime,
        default=lambda: dt.datetime.now(dt.timezone.utc),
        nullable=False,
    )


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)

    posts: Mapped[list[Post]] = relationship(
        secondary=post_tags,
        back_populates="tags",
        lazy="selectin",
    )
    photos: Mapped[list[Photo]] = relationship(
        secondary=photo_tags,
        back_populates="tags",
        lazy="selectin",
    )
