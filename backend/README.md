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

Uploaded photos are stored on disk and served from `/uploads/...`.

- Default path: `backend/uploads/photos/`
- Configurable via env var: `APP_UPLOADS_DIR` (defaults to `./backend/uploads`)

### Production persistence note

Many free hosts (including Render free web services) use an **ephemeral filesystem**. That means:

- uploaded files can disappear after a restart/redeploy
- a SQLite database file can also be lost for the same reason

If you need persistence in production, point `APP_UPLOADS_DIR` (and your DB) at a persistent volume/disk, or use external storage (S3/Cloudinary/Supabase Storage) and a managed database.

## Free persistence recipe (no disk)

If your host does not support persistent disks on the free tier, use:

- a **managed Postgres** database (free tiers: Supabase / Neon / etc.)
- **Cloudinary** (or similar) for photo storage

### Managed DB (recommended)

Set `APP_DB_URL` to a Postgres SQLAlchemy URL (example):

- `postgresql+psycopg://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require`

### Cloudinary photos

Set:

- `APP_CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>`
- `APP_CLOUDINARY_FOLDER=portfolio-hub` (optional)

When Cloudinary is configured, the API stores photo files in Cloudinary and saves the returned HTTPS URL in `Photo.file_path`.
