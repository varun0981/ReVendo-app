import { useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../components/AuthLayout'
import { registerAccount } from '../services/api'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', acceptTerms: false })
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  function update(event) {
    const { name, value, checked, type } = event.target
    const nextValue = name === 'phone' ? value.replace(/[\s()-]/g, '') : value
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : nextValue }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const result = await registerAccount(form)
      toast.success('Your account is ready for verification.')
      navigate('/verify-email', {
        state: {
          email: form.email,
          developmentEmailLink: result.developmentEmailLink,
          deliveryMode: result.deliveryMode,
        },
      })
    } catch (requestError) {
      const { response, code } = requestError
      if (response?.data?.message) {
        setError(response.data.message)
      } else if (response) {
        setError(`The registration service returned HTTP ${response.status}. Confirm the API is running on port 5051 and the frontend proxy points to it.`)
      } else if (code === 'ECONNABORTED') {
        setError('The registration request timed out. Check that the API and MongoDB are running, then try again.')
      } else {
        setError('Cannot reach the registration service. Start MongoDB and the API, then try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout eyebrow="MAKE ROOM FOR GOOD THINGS" title="Join ReVendo." description="A few details, then you’re on your way.">
      <form className="auth-form register-form" onSubmit={handleSubmit}>
        <label>Full name<input autoComplete="name" name="name" required minLength={2} maxLength={80} value={form.name} onChange={update} placeholder="What should we call you?" /></label>
        <label>Email address<input autoComplete="email" name="email" type="email" required value={form.email} onChange={update} placeholder="you@example.com" /></label>
        <label>Mobile number with country code<input autoComplete="tel" inputMode="tel" name="phone" type="tel" required pattern="\+[1-9][0-9]{7,14}" value={form.phone} onChange={update} placeholder="+919876543210" /></label>
        <div className="auth-form-two">
          <label>Password
            <span className="password-field">
              <input autoComplete="new-password" name="password" type={visible ? 'text' : 'password'} required minLength={8} maxLength={72} value={form.password} onChange={update} placeholder="At least 8 characters" />
              <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((shown) => !shown)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </span>
          </label>
          <label>Confirm password<input autoComplete="new-password" name="confirmPassword" type="password" required minLength={8} maxLength={72} value={form.confirmPassword} onChange={update} placeholder="Enter it again" /></label>
        </div>
        <label className="auth-checkbox"><input type="checkbox" name="acceptTerms" checked={form.acceptTerms} onChange={update} required /><span>I agree to ReVendo’s <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</span></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Creating your account…' : 'Create my account'} <ArrowRight size={16} /></button>
      </form>
      <p className="auth-switch">Already part of the circle? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  )
}
