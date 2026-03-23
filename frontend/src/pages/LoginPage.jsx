import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../components/Card.jsx'
import TypingHeading from '../components/TypingHeading.jsx'
import { api } from '../lib/api.js'
import { setSession } from '../lib/auth.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await api.login({ username, password })
      setSession({ token: data.access_token, user: data.user })
      navigate('/')
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh bg-ink-850">
      <div className="mx-auto max-w-xl px-4 py-10">
        <TypingHeading text="login --verified-only" />
        <div className="mt-6 grid gap-4">
          <Card title="Login" subtitle="Only verified accounts can access the site.">
            <form className="grid gap-3" onSubmit={onSubmit}>
              <input
                className="input"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
              <input
                className="input"
                placeholder="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              {error ? <div className="text-sm text-rose-300 font-mono">{error}</div> : null}
              <button className="btn btnPrimary" disabled={busy}>
                {busy ? 'Logging in…' : 'Login'}
              </button>
              <div className="muted text-sm">
                Need an account?{' '}
                <Link className="font-mono text-cyan-200 hover:underline" to="/signup">
                  Sign up
                </Link>
              </div>
            </form>
          </Card>

          <Card title="Default admin" subtitle="Created on first backend run.">
            <div className="flex flex-wrap items-center gap-2 text-sm font-mono">
              <span className="kbd">admin</span>
              <span className="opacity-60">/</span>
              <span className="kbd">QWERTY</span>
              <span className="muted">(change after first login)</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
