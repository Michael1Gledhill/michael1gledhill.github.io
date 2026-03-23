from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=str(Path(__file__).resolve().parents[1] / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    secret_key: str = "dev-insecure-secret"
    db_url: str = "sqlite+pysqlite:///./backend/app.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Bootstrap admin account (dev convenience).
    # If no admin user exists, the app will create one (or promote an existing user
    # with the configured username). Configure these in backend/.env for production.
    bootstrap_admin: bool = True
    default_admin_username: str = "admin"
    default_admin_password: str = "QWERTY"
    reset_bootstrap_admin_password: bool = True

    access_token_exp_minutes: int = 60 * 8

    @property
    def cors_origin_list(self) -> list[str]:
        # Allow '*' explicitly if configured
        raw = (self.cors_origins or "").strip()
        if raw == "*":
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]
