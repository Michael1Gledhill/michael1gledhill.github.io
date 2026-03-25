import React, { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card.jsx'
import Modal from '../components/Modal.jsx'
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

function PhotoTile({ photo, onClick }) {
  const src = fileUrl(photo.file_path)

  return (
    <button
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-glow"
      onClick={onClick}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.04] group-hover:opacity-90"
      />
      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />
      </div>
    </button>
  )
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState([])
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(null)

  useEffect(() => {
    let ignore = false
    Promise.all([api.listPhotos(), api.listPosts()])
      .then(([ph, p]) => {
        if (ignore) return
        setPhotos(ph || [])
        setPosts(p || [])
      })
      .catch((e) => setError(e.message || 'Failed to load photos'))
    return () => {
      ignore = true
    }
  }, [])

  const grid = useMemo(() => {
    return photos
  }, [photos])

  const missionStart = getMissionStartDate() || inferMissionStartDate(grid, (p) => p?.taken_at || p?.uploaded_at)
  const weekGroups = groupByWeek(grid, (p) => p?.taken_at || p?.uploaded_at, missionStart)

  const postById = useMemo(() => {
    const m = new Map()
    for (const p of posts || []) m.set(p.id, p)
    return m
  }, [posts])

  const openPhoto = (p) => {
    setActive(p)
    setOpen(true)
  }

  const src = active ? fileUrl(active.file_path) : ''
  const activePost = active?.post_id ? postById.get(active.post_id) : null

  return (
    <div className="grid gap-4">
      <Card title="Gallery" subtitle="Weekly grouped photos with a modal viewer">
        <TypingHeading text="ls uploads/photos" />
        {error ? <div className="mt-3 text-sm font-mono text-rose-300">{error}</div> : null}
        <p className="muted mt-3 text-sm">Admins can upload photos in the Admin dashboard.</p>
      </Card>

      <div className="grid gap-5">
        {weekGroups.map(([label, items]) => {
          const sorted = [...items].sort((a, b) => String(b.taken_at || b.uploaded_at).localeCompare(String(a.taken_at || a.uploaded_at)))
          return (
            <section key={label} className="grid gap-3">
              <div className="font-mono text-xs text-cyan-200/80">{label}</div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {sorted.map((p) => (
                  <PhotoTile key={p.id} photo={p} onClick={() => openPhoto(p)} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        {active ? (
          <div className="grid gap-3">
            <img src={src} alt="" className="w-full rounded-xl border border-white/10" />
            <div className="text-xs font-mono text-slate-300">
              <div>taken_at: {fmt(active.taken_at || active.uploaded_at)}</div>
              {activePost ? <div>linked_post: {activePost.title}</div> : null}
              <TagPills tags={active.tags} />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
