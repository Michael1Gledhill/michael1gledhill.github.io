// Runtime configuration for the static GitHub Pages frontend.
// This file is loaded by index.html before the React app starts.
//
// IMPORTANT:
// - For local dev: set API_BASE to http://127.0.0.1:8000 (or use frontend/.env.local)
// - For GitHub Pages: set this to your deployed backend URL (Render/Fly/etc.)
//
// Example:
// window.__APP_CONFIG__ = { API_BASE: 'https://your-backend.onrender.com' }

window.__APP_CONFIG__ = {
  // Leave blank by default so GitHub Pages doesn't accidentally try localhost.
  API_BASE: '',
}
