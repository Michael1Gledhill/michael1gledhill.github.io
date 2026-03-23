import React, { useEffect, useState } from 'react'
import Card from '../components/Card.jsx'
import TypingHeading from '../components/TypingHeading.jsx'
import { api } from '../lib/api.js'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    api
      .meProfile()
      .then((p) => {
        if (!ignore) setProfile(p)
      })
      .catch((e) => setError(e.message || 'Failed to load profile'))
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="grid gap-4">
      <Card title="Profile" subtitle="Developer-style resume cards">
        <TypingHeading text="cat resume.json" />
        {error ? <div className="mt-3 text-sm font-mono text-rose-300">{error}</div> : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="About Me">
          <p className="text-sm text-slate-200 leading-relaxed">{profile?.about || 'Loading…'}</p>
        </Card>
        <Card title="Skills">
          <ul className="grid gap-2 text-sm font-mono">
            {(profile?.skills || []).map((s) => (
              <li key={s} className="kbd inline-block w-fit">
                {s}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Experience">
          <ul className="grid gap-2 text-sm text-slate-200">
            {(profile?.experience || []).map((e, idx) => (
              <li key={idx} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                {e}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
