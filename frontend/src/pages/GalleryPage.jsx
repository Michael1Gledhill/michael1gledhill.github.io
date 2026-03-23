import React, { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card.jsx'
import Modal from '../components/Modal.jsx'
import TypingHeading from '../components/TypingHeading.jsx'
import { api, fileUrl } from '../lib/api.js'

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
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(null)

  useEffect(() => {
    let ignore = false
    api
      .listPhotos()
      .then((p) => {
        if (!ignore) setPhotos(p)
      })
      .catch((e) => setError(e.message || 'Failed to load photos'))
    return () => {
      ignore = true
    }
  }, [])

  const grid = useMemo(() => {
    return photos
  }, [photos])

  const openPhoto = (p) => {
    setActive(p)
    setOpen(true)
  }

  const src = active ? fileUrl(active.file_path) : ''

  return (
    <div className="grid gap-4">
      <Card title="Gallery" subtitle="Hover-zoom grid with modal viewer">
        <TypingHeading text="ls uploads/photos" />
        {error ? <div className="mt-3 text-sm font-mono text-rose-300">{error}</div> : null}
        <p className="muted mt-3 text-sm">Admins can upload photos in the Admin dashboard.</p>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {grid.map((p) => (
          <PhotoTile key={p.id} photo={p} onClick={() => openPhoto(p)} />
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        {active ? (
          <img src={src} alt="" className="w-full rounded-xl border border-white/10" />
        ) : null}
      </Modal>
    </div>
  )
}
