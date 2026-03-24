import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card.jsx'
import TypingHeading from '../components/TypingHeading.jsx'
import { getApiBase } from '../lib/api.js'

function normalizeBase(value) {
  const v = (value || '').trim().replace(/\/+$/, '')
  return v
}

export default function ApiConfigPage() {
  const current = getApiBase()
  const [value, setValue] = useState(() => {
    try {
      return window.localStorage.getItem('api_base_override') || ''
    } catch {
      return ''
    }
  })
  const [msg, setMsg] = useState('')

  const pageIsHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:'

  const effectivePreview = useMemo(() => {
    const n = normalizeBase(value)
    return n || current
  }, [value, current])

  const save = () => {
    const next = normalizeBase(value)
    setMsg('')

    if (!next) {
      try {
        window.localStorage.removeItem('api_base_override')
        setMsg('Cleared override. Reloading…')
        window.location.reload()
      } catch {
        setMsg('Could not clear override (storage blocked).')
      }
      return
    }

    if (!/^https?:\/\//i.test(next)) {
      setMsg('Please enter a full URL like https://your-backend.onrender.com')
      return
    }

    if (pageIsHttps && next.toLowerCase().startsWith('http:')) {
      setMsg('This page is HTTPS. Using an HTTP API will be blocked (mixed content). Use an HTTPS backend URL.')
      return
    }

    try {
      window.localStorage.setItem('api_base_override', next)
      setMsg('Saved. Reloading…')
      window.location.reload()
    } catch {
      setMsg('Could not save (storage blocked).')
    }
  }

  return (
    <div className="min-h-dvh bg-ink-850">
      <div className="mx-auto max-w-xl px-4 py-10">
        <TypingHeading text="config --api-base" />

        <div className="mt-6 grid gap-4">
          <Card
            title="API Base URL"
            subtitle="Set where the frontend sends /api/* requests. Useful on GitHub Pages."
          >
            <div className="grid gap-3">
              <div className="text-sm font-mono">
                <div className="muted">Current effective API_BASE</div>
                <div className="mt-1 break-all rounded-xl border border-white/10 bg-white/5 p-3">{effectivePreview}</div>
              </div>

              <input
                className="input"
                placeholder="https://your-backend.onrender.com"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />

              <div className="muted text-xs">
                Tip: On GitHub Pages your site is HTTPS, so your backend must also be HTTPS.
              </div>

              {msg ? <div className="text-sm font-mono text-cyan-200/90">{msg}</div> : null}

              <div className="flex flex-wrap gap-2">
                <button className="btn btnPrimary" onClick={save}>
                  Save & reload
                </button>
                <Link className="btn" to="/login">
                  Back to login
                </Link>
              </div>

              <div className="muted text-xs">
                Note: this override is stored in your browser (localStorage). It fixes your device immediately,
                but other visitors still need the repo variable <span className="font-mono">VITE_API_BASE</span> set.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
