# Frontend (React + Tailwind)

## Local dev

- Install:
  - `npm install`
- Run:
  - `npm run dev`

By default it talks to `http://127.0.0.1:8000`.

### Configure API base

Create `frontend/.env.local`:

- `VITE_API_BASE=http://127.0.0.1:8000`

(For CI / Pages builds, the workflow sets `VITE_API_BASE=/api`.)
