import { useState } from 'react'
import { ArrowRight, Smartphone } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../components/AuthLayout'
import { sendOtp, verifyOtp } from '../services/api'

export default function VerifyPhonePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [developmentOtp, setDevelopmentOtp] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function requestCode() {
    setSending(true)
    setError('')
    setMessage('')
    try {
      const result = await sendOtp({ email })
      setMessage(result.deliveryMode || result.message)
      setDevelopmentOtp(result.developmentOtp || '')
      if (result.developmentOtp) setOtp(result.developmentOtp)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not send a verification code.')
    } finally {
      setSending(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await verifyOtp({ email, otp })
      toast.success('Your mobile number is verified.')
      navigate('/login')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'That code could not be verified.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout eyebrow="LAST LITTLE STEP" title="Verify your number." description="We’ll send a one-time code to the number you registered.">
      <div className="verification-icon"><Smartphone size={24} /></div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Account email<input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <button className="auth-secondary-button" type="button" disabled={sending || !email} onClick={requestCode}>{sending ? 'Sending code…' : 'Send a one-time code'}</button>
        {message && <p className={developmentOtp ? 'dev-mode-note' : 'auth-success'}>{developmentOtp ? `Development OTP: ${developmentOtp} — no SMS was sent.` : message}</p>}
        <label>Six-digit code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Verifying…' : 'Verify mobile number'} <ArrowRight size={16} /></button>
      </form>
      <p className="auth-switch">Need help? <a href="mailto:hello@revendo.local">Contact us</a></p>
    </AuthLayout>
  )
}
