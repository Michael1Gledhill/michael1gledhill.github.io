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

## Notes

GitHub Pages can only host the **static frontend**. The FastAPI backend must be hosted separately for production.
