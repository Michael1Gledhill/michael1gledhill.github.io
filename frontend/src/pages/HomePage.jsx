import React from 'react'
import Card from '../components/Card.jsx'
import TypingHeading from '../components/TypingHeading.jsx'

export default function HomePage() {
  return (
    <div className="grid gap-4">
      <Card
        title="Welcome"
        subtitle="A sleek portfolio hub with a private journal + gallery."
        right={<div className="font-mono text-xs text-slate-400">v1.0</div>}
      >
        <TypingHeading text="status --online" />
        <p className="mt-4 text-sm text-slate-200 leading-relaxed">
          This app is intentionally minimal: clean cards, soft glow accents, and a developer-friendly layout.
          Verified users can browse your profile, gallery, and journal posts.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="kbd">React</span>
          <span className="kbd">Tailwind</span>
          <span className="kbd">FastAPI</span>
          <span className="kbd">SQLite</span>
          <span className="kbd">JWT</span>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Profile" subtitle="About · Skills · Experience">
          <p className="muted text-sm">Admin-editable resume cards with a subtle typing header.</p>
        </Card>
        <Card title="Gallery" subtitle="SmugMug-ish grid">
          <p className="muted text-sm">Hover zoom + modal viewer. Admin uploads coming from the dashboard.</p>
        </Card>
        <Card title="Journal" subtitle="Chronological posts">
          <p className="muted text-sm">Clean, readable cards. Admin CRUD controls available in Admin.</p>
        </Card>
      </div>
    </div>
  )
}
