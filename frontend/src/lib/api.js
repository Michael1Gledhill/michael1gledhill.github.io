const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

export function getApiBase() {
  return DEFAULT_API_BASE
}

export function fileUrl(filePath) {
  // filePath is stored like: 'uploads/photos/<file>'
  // If API base is relative (e.g. '/api'), resolve against current origin.
  const rawBase = DEFAULT_API_BASE.startsWith('http') ? DEFAULT_API_BASE : `${window.location.origin}${DEFAULT_API_BASE}`

  // If your API is mounted under /api, uploaded assets are typically served from /uploads at the same origin.
  const assetBase = rawBase.replace(/\/api\/?$/, '/')
  return new URL(filePath.replace(/^\/+/, ''), assetBase.endsWith('/') ? assetBase : `${assetBase}/`).toString()
}

export function authHeader() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const url = `${getApiBase()}${path}`
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const msg = await safeError(res)
    throw new Error(msg)
  }

  if (res.status === 204) return null
  return res.json()
}

async function safeError(res) {
  try {
    const data = await res.json()
    if (data?.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    return JSON.stringify(data)
  } catch {
    return `${res.status} ${res.statusText}`
  }
}

export const api = {
  health: () => request('/api/health'),

  signup: (payload) => request('/api/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),

  meProfile: () => request('/api/profile/', { headers: authHeader() }),
  updateProfile: (payload) => request('/api/profile/', { method: 'PUT', body: payload, headers: authHeader() }),

  listPosts: () => request('/api/posts/', { headers: authHeader() }),
  getPost: (id) => request(`/api/posts/${id}`, { headers: authHeader() }),
  createPost: (payload) => request('/api/posts/', { method: 'POST', body: payload, headers: authHeader() }),
  updatePost: (id, payload) => request(`/api/posts/${id}`, { method: 'PUT', body: payload, headers: authHeader() }),
  deletePost: (id) => request(`/api/posts/${id}`, { method: 'DELETE', headers: authHeader() }),

  listPhotos: () => request('/api/photos/', { headers: authHeader() }),
  deletePhoto: (id) => request(`/api/photos/${id}`, { method: 'DELETE', headers: authHeader() }),

  adminListUsers: () => request('/api/admin/users', { headers: authHeader() }),
  adminPatchUser: (id, payload) => request(`/api/admin/users/${id}`, { method: 'PATCH', body: payload, headers: authHeader() }),
}
