function runtimeApiBase() {
  try {
    const fromStorage = window?.localStorage?.getItem('api_base_override')
    if (typeof fromStorage === 'string' && fromStorage.trim()) return fromStorage.trim()

    // eslint-disable-next-line no-undef
    const fromWindow = window?.__APP_CONFIG__?.API_BASE
    if (typeof fromWindow === 'string' && fromWindow.trim()) return fromWindow.trim()
  } catch {
    // ignore
  }
  return null
}

function defaultApiBase() {
  const configured = runtimeApiBase() || import.meta.env.VITE_API_BASE
  if (configured) return configured

  // On GitHub Pages, falling back to localhost is always wrong and often blocked by mixed-content.
  const onGithubPages =
    typeof window !== 'undefined' &&
    typeof window.location?.hostname === 'string' &&
    window.location.hostname.endsWith('github.io')
  if (onGithubPages) return ''

  // Local/dev fallback
  return 'http://127.0.0.1:8000'
}

const DEFAULT_API_BASE = defaultApiBase()

export function getApiBase() {
  return DEFAULT_API_BASE
}

function joinUrl(base, path) {
  const b = (base || '').replace(/\/+$/, '')
  const p = (path || '').startsWith('/') ? path : `/${path}`
  return `${b}${p}`
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
  const apiBase = getApiBase()
  if (!apiBase) {
    throw new Error(
      'Backend not configured. Set an HTTPS API Base in /#/config, or set the repository variable VITE_API_BASE and redeploy.'
    )
  }
  const url = joinUrl(apiBase, path)

  let res
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    // Typically CORS, mixed-content (https page calling http API), DNS, or backend down.
    const isHttpsPage = typeof window !== 'undefined' && window.location?.protocol === 'https:'
    const baseLooksHttp = typeof apiBase === 'string' && apiBase.trim().toLowerCase().startsWith('http:')
    const hint =
      isHttpsPage && baseLooksHttp
        ? 'Your site is on https but API_BASE is http (mixed content). Use an https backend URL.'
        : 'Check that API_BASE points to a reachable backend and that backend CORS allows this site.'
    throw new Error(`Network error contacting API at ${url}. API_BASE=${apiBase}. ${hint}`)
  }

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
