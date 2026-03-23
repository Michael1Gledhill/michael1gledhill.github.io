import React, { useEffect, useMemo, useState } from 'react'

export default function TypingHeading({ text }) {
  const chars = useMemo(() => (text || '').split(''), [text])
  const [i, setI] = useState(0)

  useEffect(() => {
    setI(0)
    const id = setInterval(() => {
      setI((prev) => {
        if (prev >= chars.length) return prev
        return prev + 1
      })
    }, 28)
    return () => clearInterval(id)
  }, [chars.length])

  return (
    <div className="font-mono text-sm text-cyan-200/90">
      <span className="opacity-70">$</span> {chars.slice(0, i).join('')}
      <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-cyan-300/60 align-middle" />
    </div>
  )
}
