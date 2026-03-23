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


class PostOut(BaseModel):
    id: int
    title: str
    content: str
    created_at: dt.datetime


class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)


class PostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1)


class PhotoOut(BaseModel):
    id: int
    file_path: str
    uploaded_at: dt.datetime
