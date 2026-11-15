import { useRef, useState } from 'react'
import { ArrowLeft, Camera, Check, Save } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'
import { updateMyProfile } from '../services/api'
import { getImageUrl } from '../utils/format'

export default function EditProfilePage() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', location: user?.location || '', bio: user?.bio || '' })
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  function chooseImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPEG, PNG, or WebP image smaller than 5 MB.')
      return
    }
    setError('')
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => data.set(key, value))
    if (image) data.set('profileImage', image)
    try {
      const updated = await updateMyProfile(data)
      updateUser(updated)
      toast.success('Profile updated.')
      navigate('/profile')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="edit-page page-gutter">
        <Link className="back-link" to="/profile"><ArrowLeft size={16} /> Back to your space</Link>
        <div className="edit-page-heading"><span className="eyebrow">A LITTLE MORE YOU</span><h1>Edit your profile.</h1><p>Help good things find their way to you.</p></div>
        <form className="edit-profile-form" onSubmit={handleSubmit}>
          <div className="profile-photo-picker">
            <div className="profile-photo-preview">{preview || user?.profileImage ? <img src={preview || getImageUrl(user.profileImage)} alt="" /> : <span>{user?.name?.[0]?.toUpperCase()}</span>}</div>
            <div><button type="button" onClick={() => inputRef.current?.click()}><Camera size={15} /> Change photo</button><small>JPEG, PNG or WebP · up to 5 MB</small></div>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={chooseImage} />
          </div>
          <div className="edit-form-grid">
            <label>Full name<input required minLength={2} maxLength={80} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label>Email address<input disabled value={user?.email || ''} /><small>Your sign-in email can’t be changed here.</small></label>
            <label>Mobile number<input disabled value={user?.phone || ''} /><small>Phone-number changes require re-verification.</small></label>
            <label>Location<input maxLength={100} value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="City or neighborhood" /></label>
            <label className="edit-bio-label">A little about you<textarea rows={4} maxLength={500} value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} placeholder="Tell your neighbors a little something…" /><small>{form.bio.length}/500</small></label>
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <div className="edit-form-footer"><span><Check size={15} /> Your email and phone stay private.</span><button className="sell-account-button" type="submit" disabled={saving}><Save size={15} />{saving ? 'Saving…' : 'Save changes'}</button></div>
        </form>
      </main>
      <Footer />
    </>
  )
}
