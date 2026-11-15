import { useState } from 'react'
import { ArrowRight, MailCheck } from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../components/AuthLayout'
import { verifyEmail } from '../services/api'

export default function VerifyEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || location.state?.email || '')
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await verifyEmail({ email, token })
      toast.success('Email verified.')
      navigate(`/verify-phone?email=${encodeURIComponent(email)}`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'This verification link could not be used.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout eyebrow="ONE QUICK CHECK" title="Check your inbox." description="Verify your email address to keep your ReVendo account safe.">
      <div className="verification-icon"><MailCheck size={24} /></div>
      {location.state?.deliveryMode && <p className="dev-mode-note">{location.state.deliveryMode}. No email was sent.</p>}
      {location.state?.developmentEmailLink && (
        <a className="development-link" href={location.state.developmentEmailLink}>Open your development verification link <ArrowRight size={14} /></a>
      )}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Email address<input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label>Verification token<input required minLength={64} maxLength={64} value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste the link token" /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Verifying…' : 'Verify email'} <ArrowRight size={16} /></button>
      </form>
      <p className="auth-switch">Already verified? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  )
}
