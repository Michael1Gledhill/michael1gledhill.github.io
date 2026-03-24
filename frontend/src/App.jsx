import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Shell from './components/Shell.jsx'
import RequireAuth from './routes/RequireAuth.jsx'
import RequireAdmin from './routes/RequireAdmin.jsx'

import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import ApiConfigPage from './pages/ApiConfigPage.jsx'
import HomePage from './pages/HomePage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import GalleryPage from './pages/GalleryPage.jsx'
import JournalPage from './pages/JournalPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/config" element={<ApiConfigPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
