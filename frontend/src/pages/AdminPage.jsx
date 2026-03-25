import React, { useEffect, useMemo, useRef, useState } from 'react'
import Card from '../components/Card.jsx'
import TypingHeading from '../components/TypingHeading.jsx'
import { api, fileUrl, getApiBase } from '../lib/api.js'
import {
  datetimeLocalValueToIso,
  getMissionStartDate,
  inferMissionStartDate,
  isoToDatetimeLocalValue,
  setMissionStartDate,
  weekIndexFor,
  weekLabelFor,
} from '../lib/mission.js'

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

function parseTags(text) {
  return String(text || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function joinTags(tags) {
  return Array.isArray(tags) ? tags.filter(Boolean).join(', ') : ''
}

function escapeHtml(s) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function digestHtmlForWeek({ weekNumber, missionStart, posts, photos }) {
  const weekPosts = (posts || []).filter((p) => weekIndexFor(p?.published_at || p?.created_at, missionStart) === weekNumber)
  const weekPhotos = (photos || []).filter((p) => weekIndexFor(p?.taken_at || p?.uploaded_at, missionStart) === weekNumber)

  const postPhotos = new Map()
  for (const ph of weekPhotos) {
    if (!ph?.post_id) continue
    const arr = postPhotos.get(ph.post_id) || []
    arr.push(ph)
    postPhotos.set(ph.post_id, arr)
  }

  const orphanPhotos = weekPhotos.filter((p) => !p?.post_id)

  const parts = []
  parts.push(`<h2>Week ${weekNumber} Update</h2>`)

  if (weekPosts.length) {
    parts.push('<h3>Journal</h3>')
    for (const p of weekPosts) {
      const dateText = escapeHtml(new Date(p.published_at || p.created_at).toLocaleDateString())
      const title = escapeHtml(p.title)
      const tags = Array.isArray(p.tags) && p.tags.length ? `<div><small>Tags: ${escapeHtml(p.tags.join(', '))}</small></div>` : ''
      const content = escapeHtml(p.content).replaceAll('\n', '<br/>')

      parts.push(`<div>`)
      parts.push(`<strong>${title}</strong> <small>(${dateText})</small>`)
      parts.push(tags)
      parts.push(`<div>${content}</div>`)

      const linked = postPhotos.get(p.id) || []
      if (linked.length) {
        parts.push('<div><small>Photos:</small><ul>')
        for (const ph of linked) {
          const href = escapeHtml(fileUrl(ph.file_path))
          parts.push(`<li><a href="${href}">${href}</a></li>`)
        }
        parts.push('</ul></div>')
      }
      parts.push(`</div><br/>`)
    }
  }

  if (orphanPhotos.length) {
    parts.push('<h3>Photos</h3>')
    parts.push('<ul>')
    for (const ph of orphanPhotos) {
      const t = Array.isArray(ph.tags) && ph.tags.length ? ` (tags: ${escapeHtml(ph.tags.join(', '))})` : ''
      const href = escapeHtml(fileUrl(ph.file_path))
      parts.push(`<li><a href="${href}">${href}</a>${t}</li>`)
    }
    parts.push('</ul>')
  }

  if (!weekPosts.length && !weekPhotos.length) {
    parts.push('<p><em>No updates this week.</em></p>')
  }

  return parts.join('\n')
}

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [newPost, setNewPost] = useState({ title: '', content: '', published_at: '', tagsText: '' })
  const [editing, setEditing] = useState(null)
  const [editingPhoto, setEditingPhoto] = useState(null)

  const [missionStartText, setMissionStartText] = useState(() => {
    try {
      const d = getMissionStartDate()
      return d ? d.toISOString().slice(0, 10) : ''
    } catch {
      return ''
    }
  })

  const [digestWeek, setDigestWeek] = useState(1)
  const [digestHtml, setDigestHtml] = useState('')
  const [digestRecipients, setDigestRecipients] = useState('')

  const refresh = async () => {
    setError('')
    setBusy(true)
    try {
      const [u, p, ph] = await Promise.all([api.adminListUsers(), api.listPosts(), api.listPhotos()])
      setUsers(u)
      setPosts(p)
      setPhotos(ph)
    } catch (e) {
      setError(e.message || 'Failed to load admin data')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const inferredMissionStart = useMemo(() => {
    return inferMissionStartDate(
      [...(posts || []), ...(photos || [])],
      (x) => x?.published_at || x?.taken_at || x?.created_at || x?.uploaded_at,
    )
  }, [posts, photos])

  const missionStart = getMissionStartDate() || inferredMissionStart

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
      await api.createPost({
        title: newPost.title,
        content: newPost.content,
        published_at: newPost.published_at || undefined,
        tags: parseTags(newPost.tagsText),
      })
      setNewPost({ title: '', content: '', published_at: '', tagsText: '' })
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
    setEditing({
      id: post.id,
      title: post.title,
      content: post.content,
      published_at: post.published_at || post.created_at || '',
      tagsText: joinTags(post.tags),
    })
  }

  const saveEdit = async () => {
    if (!editing) return
    setError('')
    try {
      await api.updatePost(editing.id, {
        title: editing.title,
        content: editing.content,
        published_at: editing.published_at || undefined,
        tags: parseTags(editing.tagsText),
      })
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

  const startEditPhoto = (p) => {
    setEditingPhoto({
      id: p.id,
      taken_at: p.taken_at || p.uploaded_at || '',
      post_id: p.post_id ?? null,
      tagsText: joinTags(p.tags),
    })
  }

  const savePhotoEdit = async () => {
    if (!editingPhoto) return
    setError('')
    try {
      const payload = {
        post_id: editingPhoto.post_id,
        tags: parseTags(editingPhoto.tagsText),
      }
      if (editingPhoto.taken_at) payload.taken_at = editingPhoto.taken_at
      await api.patchPhoto(editingPhoto.id, payload)
      setEditingPhoto(null)
      await refresh()
    } catch (e) {
      setError(e.message || 'Failed to update photo')
    }
  }

  const saveMissionStart = async () => {
    setError('')
    try {
      if (missionStartText) setMissionStartDate(missionStartText)
      else setMissionStartDate('')
      await refresh()
    } catch (e) {
      setError(e.message || 'Failed to save mission start date')
    }
  }

  const generateDigest = () => {
    setError('')
    const html = digestHtmlForWeek({
      weekNumber: Number(digestWeek) || 1,
      missionStart,
      posts,
      photos,
    })
    setDigestHtml(html)

    const recipients = (users || [])
      .filter((u) => u?.receive_emails && u?.is_verified)
      .map((u) => u.email)
      .filter(Boolean)
      .join(', ')
    setDigestRecipients(recipients)
  }

  const copyDigest = async () => {
    try {
      await navigator.clipboard.writeText(digestHtml || '')
    } catch (e) {
      setError(e?.message || 'Failed to copy to clipboard')
    }
  }

  return (
    <div className="grid gap-4">
      <Card title="Admin" subtitle="Approve users · manage posts · manage photos · weekly digest" right={<TypingHeading text={busy ? 'sync --busy' : 'sync --ok'} />}>
        {error ? <div className="text-sm font-mono text-rose-300">{error}</div> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn" onClick={refresh} disabled={busy}>
            Refresh
          </button>
        </div>
      </Card>

      <Card title="Mission settings" subtitle="Used for Week 1 / Week 2 grouping">
        <div className="grid gap-3 sm:grid-cols-[260px,auto] sm:items-end">
          <label className="grid gap-2">
            <div className="muted text-xs font-mono">Mission start (YYYY-MM-DD)</div>
            <input className="input" value={missionStartText} onChange={(e) => setMissionStartText(e.target.value)} placeholder="2026-01-01" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="btn btnPrimary" onClick={saveMissionStart}>
              Save
            </button>
            <button className="btn" onClick={() => setMissionStartText('')}>
              Clear
            </button>
          </div>
        </div>
        <div className="muted mt-3 text-xs font-mono">
          Current grouping label example: {weekLabelFor(new Date().toISOString(), missionStart)}
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
        <Card title="Weekly digest" subtitle="Generate HTML to paste into an email">
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-[140px,auto] sm:items-end">
              <label className="grid gap-2">
                <div className="muted text-xs font-mono">Week #</div>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={digestWeek}
                  onChange={(e) => setDigestWeek(Number(e.target.value || 1))}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button className="btn btnPrimary" onClick={generateDigest}>
                  Generate
                </button>
                <button className="btn" onClick={copyDigest} disabled={!digestHtml}>
                  Copy HTML
                </button>
              </div>
            </div>

            {digestRecipients ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="muted text-xs font-mono">Recipients (opted-in, verified)</div>
                <div className="mt-1 break-words text-xs font-mono text-slate-200">{digestRecipients}</div>
              </div>
            ) : null}

            <textarea
              className="input min-h-48 font-mono text-xs"
              placeholder="Generate a digest to see the HTML here…"
              value={digestHtml}
              onChange={(e) => setDigestHtml(e.target.value)}
            />
            <div className="muted text-xs">Tip: you can tweak the HTML in this box before copying.</div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Posts" subtitle="Create + edit journal posts (date + tags)">
          <div className="grid gap-3">
            <input className="input" placeholder="Title" value={newPost.title} onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))} />
            <textarea className="input min-h-28" placeholder="Content" value={newPost.content} onChange={(e) => setNewPost((p) => ({ ...p, content: e.target.value }))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <div className="muted text-xs font-mono">Published at</div>
                <input
                  className="input"
                  type="datetime-local"
                  value={isoToDatetimeLocalValue(newPost.published_at)}
                  onChange={(e) => setNewPost((p) => ({ ...p, published_at: datetimeLocalValueToIso(e.target.value) || '' }))}
                />
              </label>
              <label className="grid gap-2">
                <div className="muted text-xs font-mono">Tags (comma-separated)</div>
                <input className="input" value={newPost.tagsText} onChange={(e) => setNewPost((p) => ({ ...p, tagsText: e.target.value }))} placeholder="training, family, travel" />
              </label>
            </div>
            <button className="btn btnPrimary" onClick={createPost}>
              Create post
            </button>

            <div className="mt-2 grid gap-2">
              {posts.map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-sm">{p.title}</div>
                      <div className="muted text-xs font-mono">{p.published_at || p.created_at}</div>
                      {Array.isArray(p.tags) && p.tags.length ? <div className="muted mt-1 text-xs font-mono">tags: {p.tags.join(', ')}</div> : null}
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <div className="muted text-xs font-mono">Published at</div>
                      <input
                        className="input"
                        type="datetime-local"
                        value={isoToDatetimeLocalValue(editing.published_at)}
                        onChange={(e) => setEditing((p) => ({ ...p, published_at: datetimeLocalValueToIso(e.target.value) || '' }))}
                      />
                    </label>
                    <label className="grid gap-2">
                      <div className="muted text-xs font-mono">Tags (comma-separated)</div>
                      <input className="input" value={editing.tagsText} onChange={(e) => setEditing((p) => ({ ...p, tagsText: e.target.value }))} />
                    </label>
                  </div>
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

        <Card title="Photos" subtitle="Upload + edit date/tags + link to a post">
          <div className="grid gap-3">
            <FileDrop onFiles={onUpload} />

            <div className="grid gap-2">
              {photos.slice(0, 15).map((p) => {
                const src = fileUrl(p.file_path)
                const label = weekLabelFor(p.taken_at || p.uploaded_at, missionStart)
                return (
                  <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <img src={src} alt="" className="h-16 w-16 rounded-xl border border-white/10 object-cover" loading="lazy" />
                        <div>
                          <div className="font-mono text-xs text-slate-200">photo #{p.id}</div>
                          <div className="muted text-xs font-mono">{label} · {p.taken_at || p.uploaded_at}</div>
                          {Array.isArray(p.tags) && p.tags.length ? <div className="muted mt-1 text-xs font-mono">tags: {p.tags.join(', ')}</div> : null}
                          {p.post_id ? <div className="muted mt-1 text-xs font-mono">linked post: #{p.post_id}</div> : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button className="btn" onClick={() => startEditPhoto(p)}>
                          Edit
                        </button>
                        <button className="btn" onClick={() => deletePhoto(p.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {editingPhoto ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-mono text-sm text-slate-200">Edit photo #{editingPhoto.id}</div>
                <div className="mt-3 grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <div className="muted text-xs font-mono">Taken at</div>
                      <input
                        className="input"
                        type="datetime-local"
                        value={isoToDatetimeLocalValue(editingPhoto.taken_at)}
                        onChange={(e) => setEditingPhoto((p) => ({ ...p, taken_at: datetimeLocalValueToIso(e.target.value) || '' }))}
                      />
                    </label>
                    <label className="grid gap-2">
                      <div className="muted text-xs font-mono">Link to post</div>
                      <select
                        className="input"
                        value={editingPhoto.post_id ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          setEditingPhoto((p) => ({ ...p, post_id: v === '' ? null : Number(v) }))
                        }}
                      >
                        <option value="">(no link)</option>
                        {(posts || []).map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.id} {p.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <div className="muted text-xs font-mono">Tags (comma-separated)</div>
                    <input
                      className="input"
                      value={editingPhoto.tagsText}
                      onChange={(e) => setEditingPhoto((p) => ({ ...p, tagsText: e.target.value }))}
                      placeholder="training, scenery, family"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button className="btn btnPrimary" onClick={savePhotoEdit}>
                      Save changes
                    </button>
                    <button className="btn" onClick={() => setEditingPhoto(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="muted text-xs font-mono">Showing latest 15 · full gallery in Gallery page</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
