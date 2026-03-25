import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getSession } from '../lib/auth.js'

export default function RequireAdmin({ children }) {
  const loc = useLocation()
  const { token, user } = getSession()

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  }

  if (!user?.is_admin) return <Navigate to="/journal" replace />
  return children
}
