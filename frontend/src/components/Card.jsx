import React from 'react'

export default function Card({ title, subtitle, children, right }) {
  return (
    <section className="card cardHover p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          {title ? <h2 className="text-lg font-semibold tracking-tight">{title}</h2> : null}
          {subtitle ? <p className="muted mt-1 text-sm font-mono">{subtitle}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      {children}
    </section>
  )
}
