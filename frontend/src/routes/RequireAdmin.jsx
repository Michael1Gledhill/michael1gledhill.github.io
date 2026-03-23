import React from 'react'
import { Navigate } from 'react-router-dom'
import { getSession } from '../lib/auth.js'

export default function RequireAdmin({ children }) {
  const { user } = getSession()
  if (!user?.is_admin) return <Navigate to="/" replace />
  return children
}
