import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getSession } from '../lib/auth.js'

export default function RequireAuth({ children }) {
  const loc = useLocation()
  const { token, user } = getSession()

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  }

  return children
}
