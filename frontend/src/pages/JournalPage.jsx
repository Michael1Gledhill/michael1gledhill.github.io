import React, { useEffect, useState } from 'react'
import Card from '../components/Card.jsx'
import TypingHeading from '../components/TypingHeading.jsx'
import { api } from '../lib/api.js'

function fmt(iso) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export default function JournalPage() {
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    api
      .listPosts()
      .then((p) => {
        if (!ignore) setPosts(p)
      })
      .catch((e) => setError(e.message || 'Failed to load posts'))
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="grid gap-4">
      <Card title="Journal" subtitle="Chronological blog-style cards">
        <TypingHeading text="git log --oneline" />
        {error ? <div className="mt-3 text-sm font-mono text-rose-300">{error}</div> : null}
      </Card>

      <div className="grid gap-4">
        {posts.map((p) => (
          <article key={p.id} className="card cardHover p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <div className="mt-1 font-mono text-xs text-slate-400">{fmt(p.created_at)}</div>
              </div>
            </div>
            <div className="mt-3 whitespace-pre-wrap text-sm text-slate-200 leading-relaxed">{p.content}</div>
          </article>
        ))}

        {posts.length === 0 ? (
          <div className="card p-5">
            <div className="font-mono text-sm text-slate-300">No posts yet.</div>
            <div className="muted mt-2 text-sm">An admin can create the first one in Admin → Posts.</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
