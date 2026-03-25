import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearSession, getSession } from '../lib/auth.js'

function NavItem({ to, children, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `rounded-xl px-3 py-2 font-mono text-sm transition ${
          isActive ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

export default function Shell() {
  const navigate = useNavigate()
  const { token, user } = getSession()
  const isAuthed = Boolean(token && user)

  const onLogout = () => {
    clearSession()
    navigate('/journal')
  }

  const onLogin = () => {
    navigate('/login', { state: { from: '/admin' } })
  }

  return (
    <div className="min-h-dvh bg-ink-850">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-mono text-xs text-cyan-200/80">mission_journal</div>
            <h1 className="text-2xl font-semibold tracking-tight">Journal + Gallery</h1>
            <p className="muted mt-1 text-sm">Weekly updates, photos, and an admin dashboard.</p>
          </div>

          <div className="flex items-center gap-3">
            {isAuthed ? (
              <>
                <div className="hidden sm:block text-right">
                  <div className="font-mono text-xs text-slate-200">{user?.username}</div>
                  <div className="font-mono text-[11px] text-slate-400">
                    {user?.is_admin ? 'admin' : 'user'} · {user?.is_verified ? 'verified' : 'pending'}
                  </div>
                </div>
                <button className="btn" onClick={onLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button className="btn" onClick={onLogin}>
                Admin login
              </button>
            )}
          </div>
        </header>

        <nav className="card mb-6 flex flex-wrap gap-2 p-2">
          <NavItem to="/journal" end>
            Journal
          </NavItem>
          <NavItem to="/gallery">Gallery</NavItem>
          {user?.is_admin ? <NavItem to="/admin">Admin</NavItem> : null}
        </nav>

        <main className="page">
          <Outlet />
        </main>

        <footer className="mt-10 text-center text-xs text-slate-400 font-mono">
          <span className="opacity-70">Built with React + FastAPI ·</span> <span className="text-cyan-200/70">dark-mode first</span>
        </footer>
      </div>
    </div>
  )
}
