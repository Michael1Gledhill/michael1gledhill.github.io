import React from 'react'
import Card from '../components/Card.jsx'

export default function NotFound() {
  return (
    <Card title="Not found" subtitle="This route doesn't exist.">
      <div className="muted text-sm">Try the navigation links.</div>
    </Card>
  )
}
