import React from 'react'

export default function Loading({ label = 'Loading…' }) {
  return (
    <div className="card p-5">
      <div className="font-mono text-sm text-slate-200 animate-shimmer bg-[length:200%_200%] bg-gradient-to-r from-slate-200/10 via-cyan-200/15 to-slate-200/10 bg-clip-text text-transparent">
        {label}
      </div>
    </div>
  )
}
