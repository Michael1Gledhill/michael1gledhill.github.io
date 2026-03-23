import React, { useEffect, useMemo, useRef, useState } from 'react'
import Card from '../components/Card.jsx'
import TypingHeading from '../components/TypingHeading.jsx'
import { api, fileUrl, getApiBase } from '../lib/api.js'

function FileDrop({ onFiles }) {
  const ref = useRef(null)
  const [drag, setDrag] = useState(false)

  return (
    <div
      className={`rounded-2xl border border-dashed p-5 transition ${
        drag ? 'border-cyan-300/50 bg-cyan-500/5' : 'border-white/15 bg-white/5'
      }`}
      onDragEnter={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setDrag(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        const files = Array.from(e.dataTransfer.files || [])
        onFiles?.(files)
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-sm">Drag & drop photos here</div>
          <div className="muted mt-1 text-sm">PNG/JPG/WEBP/GIF · Stored on backend</div>
        </div>
        <button className="btn" onClick={() => ref.current?.click()}>
          Browse
        </button>
      </div>
      <input
        ref={ref}
        className="hidden"
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => onFiles?.(Array.from(e.target.files || []))}
      />
    </div>
  )
}

async function uploadOne(file) {
  const token = localStorage.getItem('token')
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${getApiBase()}/api/photos/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  })

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || 'Upload failed')
  }
  return res.json()
}

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [newPost, setNewPost] = useState({ title: '', content: '' })
  const [editing, setEditing] = useState(null)
  const [profile, setProfile] = useState({ about: '', skills: [], experience: [] })

  const refresh = async () => {
    setError('')
    setBusy(true)
    try {
      const [u, p, ph, prof] = await Promise.all([
        api.adminListUsers(),
        api.listPosts(),
        api.listPhotos(),
        api.meProfile(),
      ])
      setUsers(u)
      setPosts(p)
      setPhotos(ph)
      setProfile(prof)
    } catch (e) {
      setError(e.message || 'Failed to load admin data')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.id - b.id)
  }, [users])

  const toggle = async (u, patch) => {
    setError('')
    try {
      await api.adminPatchUser(u.id, patch)
      await refresh()
    } catch (e) {
      setError(e.message || 'Failed to update user')
    }
  }

  const createPost = async () => {
    setError('')
    try {
      await api.createPost(newPost)
      setNewPost({ title: '', content: '' })
      await refresh()
    } catch (e) {
      setError(e.message || 'Failed to create post')
    }
  }

  const deletePost = async (id) => {
    setError('')
    try {
      await api.deletePost(id)
      await refresh()
    } catch (e) {
      setError(e.message || 'Failed to delete post')
    }
  }

  const startEdit = (post) => {
    setEditing({ id: post.id, title: post.title, content: post.content })
  }

  const saveEdit = async () => {
    if (!editing) return
    setError('')
    try {
      await api.updatePost(editing.id, { title: editing.title, content: editing.content })
      setEditing(null)
      await refresh()
    } catch (e) {
      setError(e.message || 'Failed to update post')
    }
  }

  const deletePhoto = async (id) => {
    setError('')
    try {
      await api.deletePhoto(id)
      await refresh()
    } catch (e) {
      setError(e.message || 'Failed to delete photo')
    }
  }

  const onUpload = async (files) => {
    if (!files?.length) return
    setError('')
    setBusy(true)
    try {
      for (const f of files) {
        await uploadOne(f)
      }
      await refresh()
    } catch (e) {
      setError(e.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const saveProfile = async () => {
    setError('')
    try {
      await api.updateProfile(profile)
      await refresh()
    } catch (e) {
      setError(e.message || 'Failed to save profile')
    }
  }

  return (
    <div className="grid gap-4">
      <Card title="Admin" subtitle="Approve users · manage content · upload photos" right={<TypingHeading text={busy ? 'sync --busy' : 'sync --ok'} />}>
        {error ? <div className="text-sm font-mono text-rose-300">{error}</div> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn" onClick={refresh} disabled={busy}>
            Refresh
          </button>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Users" subtitle="Approve + promote/demote admins">
          <div className="grid gap-3">
            {sortedUsers.map((u) => (
              <div key={u.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-sm">
                      {u.username} <span className="text-slate-400">#{u.id}</span>
                    </div>
                    <div className="muted text-sm">{u.email} · {u.phone || '—'}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="kbd">verified: {String(u.is_verified)}</span>
                      <span className="kbd">admin: {String(u.is_admin)}</span>
                      <span className="kbd">emails: {String(u.receive_emails)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button className="btn" onClick={() => toggle(u, { is_verified: !u.is_verified })}>
                      {u.is_verified ? 'Unverify' : 'Approve'}
                    </button>
                    <button className="btn" onClick={() => toggle(u, { is_admin: !u.is_admin })}>
                      {u.is_admin ? 'Demote' : 'Promote'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Profile content" subtitle="Edit About/Skills/Experience">
          <div className="grid gap-3">
            <textarea
              className="input min-h-28"
              placeholder="About"
              value={profile.about}
              onChange={(e) => setProfile((p) => ({ ...p, about: e.target.value }))}
            />

            <textarea
              className="input min-h-24"
              placeholder="Skills (one per line)"
              value={(profile.skills || []).join('\n')}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  skills: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                }))
              }
            />

            <textarea
              className="input min-h-24"
              placeholder="Experience (one per line)"
              value={(profile.experience || []).join('\n')}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  experience: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                }))
              }
            />

            <button className="btn btnPrimary" onClick={saveProfile}>
              Save profile
            </button>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Posts" subtitle="Create/delete journal posts">
          <div className="grid gap-3">
            <input className="input" placeholder="Title" value={newPost.title} onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))} />
            <textarea className="input min-h-28" placeholder="Content" value={newPost.content} onChange={(e) => setNewPost((p) => ({ ...p, content: e.target.value }))} />
            <button className="btn btnPrimary" onClick={createPost}>
              Create post
            </button>

            <div className="mt-2 grid gap-2">
              {posts.map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-sm">{p.title}</div>
                      <div className="muted text-xs font-mono">{p.created_at}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn" onClick={() => startEdit(p)}>
                        Edit
                      </button>
                      <button className="btn" onClick={() => deletePost(p.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {editing ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-mono text-sm text-slate-200">Edit post #{editing.id}</div>
                <div className="mt-3 grid gap-3">
                  <input
                    className="input"
                    value={editing.title}
                    onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))}
                  />
                  <textarea
                    className="input min-h-28"
                    value={editing.content}
                    onChange={(e) => setEditing((p) => ({ ...p, content: e.target.value }))}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button className="btn btnPrimary" onClick={saveEdit}>
                      Save changes
                    </button>
                    <button className="btn" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <Card title="Photos" subtitle="Upload via drag-and-drop">
          <div className="grid gap-3">
            <FileDrop onFiles={onUpload} />
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(0, 9).map((p) => {
                const src = fileUrl(p.file_path)
                return (
                  <div key={p.id} className="relative group">
                    <img src={src} alt="" className="h-20 w-full rounded-xl border border-white/10 object-cover" loading="lazy" />
                    <button
                      className="absolute right-1 top-1 rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-xs font-mono text-slate-100 opacity-0 transition group-hover:opacity-100"
                      onClick={() => deletePhoto(p.id)}
                      title="Delete photo"
                    >
                      del
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="muted text-xs font-mono">Showing latest 9 · full gallery in Gallery page</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
