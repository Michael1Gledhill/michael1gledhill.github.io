# Backend (FastAPI + SQLite)

This is the API for the portfolio + journal + gallery app.

## Run locally

1) Create/activate a virtual environment.
2) Install deps from the repo root: `pip install -r requirements.txt`
3) Run:

- Windows PowerShell:
  - `uvicorn backend.app.main:app --reload --port 8000`

API will be at `http://127.0.0.1:8000`.

## Default admin

On first run, the backend auto-creates a default admin account:

- Username: `admin`
- Password: `QWERTY`

(Stored as a bcrypt hash in SQLite.)

## Uploads

Uploaded photos are stored in `backend/uploads/photos/` and served from `/uploads/...`.
