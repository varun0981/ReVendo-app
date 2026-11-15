import { useState } from 'react'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { changeMyPassword } from '../services/api'

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await changeMyPassword(form)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Your password has been updated.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not change your password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="edit-page page-gutter">
        <Link className="back-link" to="/profile"><ArrowLeft size={16} /> Back to your space</Link>
        <div className="edit-page-heading"><span className="eyebrow">KEEPING GOOD THINGS SAFE</span><h1>Password & security.</h1><p>Choose a password that only you know.</p></div>
        <form className="edit-profile-form password-settings-form" onSubmit={handleSubmit}>
          <label>Current password<input type="password" autoComplete="current-password" required value={form.currentPassword} onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))} /></label>
          <label>New password<input type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={form.newPassword} onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))} /></label>
          <label>Confirm new password<input type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} /></label>
          <p className="security-helper"><ShieldCheck size={16} /> Passwords are securely hashed. ReVendo never stores them in readable form.</p>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="sell-account-button" type="submit" disabled={saving}>{saving ? 'Updating…' : 'Update password'} <ArrowRight size={15} /></button>
        </form>
      </main>
      <Footer />
    </>
  )
}
