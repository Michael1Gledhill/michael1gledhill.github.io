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
  const { user } = getSession()

  const onLogout = () => {
    clearSession()
    navigate('/login')
  }

  return (
    <div className="min-h-dvh bg-ink-850">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-mono text-xs text-cyan-200/80">portfolio_hub</div>
            <h1 className="text-2xl font-semibold tracking-tight">Developer Portfolio</h1>
            <p className="muted mt-1 text-sm">Minimal, dark, card-driven. Verified users only.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="font-mono text-xs text-slate-200">{user?.username}</div>
              <div className="font-mono text-[11px] text-slate-400">
                {user?.is_admin ? 'admin' : 'user'} · {user?.is_verified ? 'verified' : 'pending'}
              </div>
            </div>
            <button className="btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>

        <nav className="card mb-6 flex flex-wrap gap-2 p-2">
          <NavItem to="/" end>
            Home
          </NavItem>
          <NavItem to="/profile">Profile</NavItem>
          <NavItem to="/gallery">Gallery</NavItem>
          <NavItem to="/journal">Journal</NavItem>
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
