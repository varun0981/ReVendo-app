import { ArrowLeft, Leaf, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AuthLayout({ children, eyebrow, title, description }) {
  return (
    <main className="auth-page">
      <div className="auth-aside">
        <Link className="brand auth-brand" to="/">
          <span className="brand-mark">r<span>.</span></span>
          <span className="brand-name">revendo</span>
        </Link>
        <div className="auth-aside-copy">
          <span className="eyebrow">Good things find their way</span>
          <h1>A little love<br />goes a <em>long way.</em></h1>
          <p>Join a more thoughtful kind of marketplace. Find something lovely, or pass a favorite on.</p>
        </div>
        <div className="auth-aside-foot"><Leaf size={17} /> Give good things a second life.</div>
        <div className="auth-aside-photo" />
      </div>
      <section className="auth-content">
        <Link className="auth-back" to="/"><ArrowLeft size={15} /> Back to ReVendo</Link>
        <div className="auth-form-wrap">
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p className="auth-description">{description}</p>
          {children}
          <div className="auth-security"><ShieldCheck size={14} /> Your details stay private and protected.</div>
        </div>
        <span className="auth-copyright">© ReVendo Marketplace · Give good things a second life.</span>
      </section>
    </main>
  )
}
