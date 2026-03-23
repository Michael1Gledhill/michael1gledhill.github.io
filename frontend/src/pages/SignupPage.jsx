import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../components/Card.jsx'
import TypingHeading from '../components/TypingHeading.jsx'
import { api } from '../lib/api.js'

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    receive_emails: false,
  })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    setError('')
    setBusy(true)
    try {
      const data = await api.signup(form)
      setMsg(data.message)
      setTimeout(() => navigate('/login'), 900)
    } catch (err) {
      const msg = err?.message || 'Signup failed'
      if (msg.toLowerCase().includes('network error contacting api') || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
        setError(msg)
        return
      }
      if (
        (msg.includes('405') || msg.toLowerCase().includes('method not allowed')) &&
        window.location.hostname.endsWith('github.io')
      ) {
        setError(
          'Signup failed (405). GitHub Pages is static and cannot handle POST /api/* requests. Configure your backend URL via repository variable/secret VITE_API_BASE (or edit config/config.js), then redeploy.'
        )
      } else {
        setError(msg)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh bg-ink-850">
      <div className="mx-auto max-w-xl px-4 py-10">
        <TypingHeading text="signup --create-user --pending-approval" />
        <div className="mt-6 grid gap-4">
          <Card title="Create account" subtitle="Accounts require admin approval before login.">
            <form className="grid gap-3" onSubmit={onSubmit}>
              <input className="input" placeholder="username" value={form.username} onChange={(e) => set('username', e.target.value)} />
              <input className="input" placeholder="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              <input className="input" placeholder="phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              <input className="input" placeholder="password" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} />

              <label className="flex items-center gap-2 font-mono text-sm text-slate-200">
                <input type="checkbox" checked={form.receive_emails} onChange={(e) => set('receive_emails', e.target.checked)} />
                Receive emails
              </label>

              {error ? <div className="text-sm text-rose-300 font-mono">{error}</div> : null}
              {msg ? <div className="text-sm text-emerald-200 font-mono">{msg}</div> : null}

              <button className="btn btnPrimary" disabled={busy}>
                {busy ? 'Submitting…' : 'Create account'}
              </button>
              <div className="muted text-sm">
                Already have an account?{' '}
                <Link className="font-mono text-cyan-200 hover:underline" to="/login">
                  Login
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
