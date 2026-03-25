from __future__ import annotations

import datetime as dt
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class Message(BaseModel):
    message: str


class SignupIn(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)
    email: EmailStr
    phone: str = Field(min_length=3, max_length=32)
    receive_emails: bool = False


class LoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict[str, Any]


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    phone: str
    receive_emails: bool
    is_verified: bool
    is_admin: bool


class UserAdminPatch(BaseModel):
    is_verified: bool | None = None
    is_admin: bool | None = None


class TagOut(BaseModel):
    id: int
    name: str


class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class PostOut(BaseModel):
    id: int
    title: str
    content: str
    created_at: dt.datetime
    published_at: dt.datetime
    tags: list[str] = []


class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    published_at: dt.datetime | None = None
    tags: list[str] = []


class PostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1)
    published_at: dt.datetime | None = None
    tags: list[str] | None = None


class PhotoOut(BaseModel):
    id: int
    file_path: str
    uploaded_at: dt.datetime
    taken_at: dt.datetime
    post_id: int | None = None
    tags: list[str] = []


class PhotoAdminPatch(BaseModel):
    taken_at: dt.datetime | None = None
    post_id: int | None = None
    tags: list[str] | None = None
