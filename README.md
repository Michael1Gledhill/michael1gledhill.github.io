# Portfolio Hub (GitHub Pages + FastAPI)

This repo is a **developer-style portfolio + gallery + journal** with:

- **FastAPI backend** (SQLite + bcrypt + JWT)
- **React frontend** (Tailwind, dark mode aesthetic)
- **Admin dashboard** (approve users, manage posts, upload photos, edit profile)

## Key behavior

- Users **must sign up** and are created as **unverified**.
- Unverified users see: "Your account is pending approval. An admin will verify your account."
- Only **verified** users can log in.
- Default admin is auto-created on first backend run:
  - Username: `admin`
  - Password: `QWERTY`

If you previously signed up `admin` as a normal (unverified) user and got stuck, the backend will now **promote** that account to admin on startup **only when no admin users exist yet**.

If credentials still don’t match because you have an old SQLite DB, delete `backend/app.db` and restart the backend to regenerate a fresh DB + default admin.

## Run locally

### Backend

- `pip install -r requirements.txt`
- Run API:
  - `uvicorn backend.app.main:app --reload --port 8000`

### Frontend

- `cd frontend`
- `npm install`
- (optional) create `frontend/.env.local` with `VITE_API_BASE=http://127.0.0.1:8000`
- `npm run dev`

Open `http://localhost:5173`.

## Deployment

GitHub Pages deployment is preserved.

The workflow builds the React frontend and copies the output into `teton/1.6/`, then uploads that folder as the Pages artifact.

### Why you see 405 on Pages login

GitHub Pages is **static hosting**. If the frontend tries to `POST /api/auth/login` against the GitHub Pages origin, GitHub will respond **405 Method Not Allowed**.

To make login work on GitHub Pages, you must point the frontend at a **real FastAPI backend** hosted elsewhere.

### Configure the backend URL for Pages

Set a **Repository Variable** (recommended) or **Repository Secret** named `VITE_API_BASE` to your backend URL, for example:

- `https://your-backend.onrender.com`

During the GitHub Actions build, it generates `teton/1.6/config/config.js` with that value.

Also set the backend CORS env `APP_CORS_ORIGINS` to include your Pages origin, e.g.:

- `https://<your-username>.github.io`

### If you see “NetworkError” / “Failed to fetch”

This usually means one of:

- The backend URL is wrong or the backend is down.
- **CORS**: your backend isn’t allowing requests from your Pages origin.
- **Mixed content**: your site is served over **https** (GitHub Pages) but your API base is **http**. Browsers block https pages from calling http APIs.

Fix: deploy the backend on **https** and set `VITE_API_BASE` to an `https://...` URL, and ensure `APP_CORS_ORIGINS` includes your Pages origin.

### Fixing the GitHub Pages mixed-content error (recommended path)

Your GitHub Pages site is served over **https**. If `API_BASE` is `http://...` (like `http://127.0.0.1:8000`) the browser will block requests.

Do this:

1) Deploy the FastAPI backend to an **https** host.
  - This repo includes a Render Blueprint at `render.yaml`.
  - On Render, create a **New +** → **Blueprint** service from this GitHub repo.
  - After deploy, copy the public URL (it will look like `https://<service>.onrender.com`).

2) In GitHub (this repo): set `VITE_API_BASE` to your backend URL.
  - Repo → Settings → Secrets and variables → Actions → Variables
  - Add `VITE_API_BASE = https://<service>.onrender.com`

3) Redeploy Pages (push a commit or re-run the workflow), then verify:
  - `https://michael1gledhill.github.io/config/config.js` shows your `https://...` API base.

4) Try logging in again from Pages.

### Render deploy fails building pydantic-core (Rust/maturin error)

Render's default Python for **new services** is currently **3.14.x**. Some dependencies (notably `pydantic-core`) might not have prebuilt wheels for 3.14 yet, which makes pip try to compile Rust during deploy.

Fix: pin Render to Python **3.13**.

This repo includes:
- a `.python-version` file (`3.13`), and
- `PYTHON_VERSION=3.13.7` in `render.yaml`

After pushing those changes, trigger a **Manual Deploy** on Render.

## Notes

GitHub Pages can only host the **static frontend**. The FastAPI backend must be hosted separately for production.

### Persistence on free hosting

Many free hosting tiers (including Render free web services) use an **ephemeral filesystem**.
If you use the default SQLite DB + local `backend/uploads`, your data and photos can disappear after a restart/redeploy.

If you don't have persistent disks available, use:

- a managed database (e.g. Supabase/Neon Postgres) via `APP_DB_URL`
- external file storage for photos (Cloudinary) via `APP_CLOUDINARY_URL`
