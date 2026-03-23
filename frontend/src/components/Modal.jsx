import React, { useEffect } from 'react'

export default function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-ink-900/80 shadow-glow backdrop-blur">
        <div className="flex items-center justify-between border-b border-white/10 p-3">
          <div className="font-mono text-xs text-slate-300">viewer</div>
          <button className="btn" onClick={onClose}>
            Close <span className="ml-2 kbd">Esc</span>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
