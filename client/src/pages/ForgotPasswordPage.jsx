import { useState } from 'react'
import { ArrowRight, KeyRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { requestPasswordReset } from '../services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [developmentLink, setDevelopmentLink] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    setDevelopmentLink('')
    try {
      const result = await requestPasswordReset({ email })
      setMessage(result.deliveryMode || result.message)
      setDevelopmentLink(result.developmentResetLink || '')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not request a password reset.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout eyebrow="IT HAPPENS TO THE BEST OF US" title="Forgot your password?" description="Enter the email linked to your account and we’ll help you get back in.">
      <div className="verification-icon"><KeyRound size={23} /></div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Email address<input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        {message && <p className={developmentLink ? 'dev-mode-note' : 'auth-success'}>{message}</p>}
        {developmentLink && <a className="development-link" href={developmentLink}>Open the development reset link <ArrowRight size={14} /></a>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send reset link'} <ArrowRight size={16} /></button>
      </form>
      <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
    </AuthLayout>
  )
}
