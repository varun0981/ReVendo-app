import { useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { resetPassword } from '../services/api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await resetPassword({ email, token, password, confirmPassword })
      navigate('/login', { state: { passwordReset: true } })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'This reset link could not be used.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout eyebrow="A FRESH START" title="Choose a new password." description="Make it something strong and easy for you to remember.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>New password
          <span className="password-field">
            <input autoComplete="new-password" type={visible ? 'text' : 'password'} minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
            <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((shown) => !shown)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </span>
        </label>
        <label>Confirm new password<input autoComplete="new-password" type="password" minLength={8} maxLength={72} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter it again" /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={submitting || !email || !token}>{submitting ? 'Updating password…' : 'Update password'} <ArrowRight size={16} /></button>
      </form>
      <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
    </AuthLayout>
  )
}
