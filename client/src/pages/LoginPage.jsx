import { useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await login({ email, password })
      toast.success('Welcome back to ReVendo.')
      navigate(location.state?.from?.pathname || '/')
    } catch (requestError) {
      const response = requestError.response?.data
      setError(response?.message || 'We could not sign you in. Please try again.')
      if (response?.code === 'EMAIL_NOT_VERIFIED') navigate('/verify-email', { state: { email } })
      if (response?.code === 'PHONE_NOT_VERIFIED') navigate(`/verify-phone?email=${encodeURIComponent(email)}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout eyebrow="YOUR NEXT GOOD THING AWAITS" title="Welcome back." description="Sign in to pick up where you left off.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Email address<input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label>Password
          <span className="password-field">
            <input autoComplete="current-password" type={visible ? 'text' : 'password'} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" />
            <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((shown) => !shown)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </span>
        </label>
        {location.state?.passwordReset && <p className="auth-success">Password updated. Sign in with your new password.</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="auth-form-between"><span>Keep your account safe</span><Link to="/forgot-password">Forgot password?</Link></div>
        <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Signing you in…' : 'Sign in'} <ArrowRight size={16} /></button>
      </form>
      <p className="auth-switch">New to ReVendo? <Link to="/register">Create an account</Link></p>
    </AuthLayout>
  )
}
