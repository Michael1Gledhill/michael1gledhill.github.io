from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.config import Settings
from backend.app.main import create_app


def test_signup_requires_admin_approval(tmp_path):
    db_path = tmp_path / "test.db"
    settings = Settings(
        secret_key="test-secret",
        db_url=f"sqlite+pysqlite:///{db_path}",
        cors_origins="*",
    )
    app = create_app(settings)

    with TestClient(app) as client:
        # Admin is auto-created
        r = client.post("/api/auth/login", json={"username": "admin", "password": "QWERTY"})
        assert r.status_code == 200
        admin_token = r.json()["access_token"]

        r = client.post(
            "/api/auth/signup",
            json={
                "username": "alice",
                "password": "hunter2!!",
                "email": "alice@example.com",
                "phone": "555-0100",
                "receive_emails": True,
            },
        )
        assert r.status_code == 201
        assert "pending approval" in r.json()["message"].lower()

        # Not verified -> cannot login
        r = client.post("/api/auth/login", json={"username": "alice", "password": "hunter2!!"})
        assert r.status_code == 403

        # Admin approves
        r = client.get("/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        users = r.json()
        alice = next(u for u in users if u["username"] == "alice")

        r = client.patch(
            f"/api/admin/users/{alice['id']}",
            json={"is_verified": True},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        assert r.json()["is_verified"] is True

        # Now login works
        r = client.post("/api/auth/login", json={"username": "alice", "password": "hunter2!!"})
        assert r.status_code == 200
        token = r.json()["access_token"]

        # Verified user can read profile
        r = client.get("/api/profile/", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert "skills" in r.json()
