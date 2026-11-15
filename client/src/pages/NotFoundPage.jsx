import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <span className="not-found-mark">r<span>.</span></span>
      <span className="eyebrow">A LITTLE OFF THE MAP</span>
      <h1>This page has<br />found a new home.</h1>
      <p>That link may have moved on. There are plenty of good things back at the beginning.</p>
      <Link to="/"><ArrowLeft size={16} /> Back to ReVendo</Link>
    </main>
  )
}
