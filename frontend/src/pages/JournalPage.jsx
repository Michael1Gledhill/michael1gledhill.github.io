import React, { useEffect, useState } from 'react'
import Card from '../components/Card.jsx'
import TypingHeading from '../components/TypingHeading.jsx'
import { api, fileUrl } from '../lib/api.js'
import { getMissionStartDate, groupByWeek, inferMissionStartDate } from '../lib/mission.js'

function fmt(iso) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function TagPills({ tags }) {
  const list = Array.isArray(tags) ? tags.filter(Boolean) : []
  if (!list.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {list.map((t) => (
        <span key={t} className="kbd">
          {t}
        </span>
      ))}
    </div>
  )
}

function PhotoStrip({ photos }) {
  const list = Array.isArray(photos) ? photos : []
  if (!list.length) return null
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
      {list.map((p) => (
        <img
          key={p.id}
          src={fileUrl(p.file_path)}
          alt=""
          loading="lazy"
          className="h-20 w-full rounded-xl border border-white/10 object-cover"
        />
      ))}
    </div>
  )
}

export default function JournalPage() {
  const [posts, setPosts] = useState([])
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    Promise.all([api.listPosts(), api.listPhotos()])
      .then(([p, ph]) => {
        if (ignore) return
        setPosts(p || [])
        setPhotos(ph || [])
      })
      .catch((e) => setError(e.message || 'Failed to load posts'))
    return () => {
      ignore = true
    }
  }, [])

  const missionStart = getMissionStartDate() || inferMissionStartDate(posts, (p) => p?.published_at || p?.created_at)
  const weekGroups = groupByWeek(
    posts,
    (p) => p?.published_at || p?.created_at,
    missionStart,
  )

  return (
    <div className="grid gap-4">
      <Card title="Journal" subtitle="Weekly grouped updates">
        <TypingHeading text="git log --oneline" />
        {error ? <div className="mt-3 text-sm font-mono text-rose-300">{error}</div> : null}
      </Card>

      <div className="grid gap-4">
        {weekGroups.map(([label, items]) => {
          const sorted = [...items].sort((a, b) => String(b.published_at || b.created_at).localeCompare(String(a.published_at || a.created_at)))
          return (
            <section key={label} className="grid gap-3">
              <div className="font-mono text-xs text-cyan-200/80">{label}</div>
              {sorted.map((p) => {
                const linked = (photos || []).filter((ph) => ph?.post_id === p.id)
                return (
                  <article key={p.id} className="card cardHover p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{p.title}</h3>
                        <div className="mt-1 font-mono text-xs text-slate-400">{fmt(p.published_at || p.created_at)}</div>
                        <TagPills tags={p.tags} />
                      </div>
                    </div>
                    <div className="mt-3 whitespace-pre-wrap text-sm text-slate-200 leading-relaxed">{p.content}</div>
                    <PhotoStrip photos={linked} />
                  </article>
                )
              })}
            </section>
          )
        })}

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
