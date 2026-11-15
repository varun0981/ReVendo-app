import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Camera, Check, ImagePlus, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { createProduct, getMyProduct, updateProduct } from '../services/api'
import { getImageUrl } from '../utils/format'

const categories = [
  'Electronics', 'Mobiles', 'Laptops', 'Fashion', 'Furniture', 'Home Appliances',
  'Books', 'Sports', 'Vehicles', 'Gaming', 'Accessories', 'Other',
]
const conditions = ['Like New', 'Excellent', 'Good', 'Fair']

export default function ProductFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const previewsRef = useRef(new Set())
  const [form, setForm] = useState({
    title: '', description: '', category: '', brand: '', price: '', originalPrice: '',
    condition: '', location: '', negotiable: false, contactPreferences: ['chat'],
  })
  const [files, setFiles] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => previewsRef.current.forEach((url) => URL.revokeObjectURL(url)), [])

  useEffect(() => {
    if (!editing) return undefined
    let active = true
    getMyProduct(id)
      .then((product) => {
        if (!active) return
        setForm({
          title: product.title,
          description: product.description,
          category: product.category,
          brand: product.brand || '',
          price: String(product.price),
          originalPrice: product.originalPrice ? String(product.originalPrice) : '',
          condition: product.condition,
          location: product.location,
          negotiable: product.negotiable,
          contactPreferences: product.contactPreferences?.length ? product.contactPreferences : ['chat'],
        })
        setExistingImages(product.images || [])
      })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load this listing.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [editing, id])

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function chooseImages(event) {
    const selected = Array.from(event.target.files || [])
    event.target.value = ''
    const valid = selected.filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 5 * 1024 * 1024)
    if (valid.length !== selected.length) {
      setError('Use JPEG, PNG, or WebP images no larger than 5 MB each.')
      return
    }
    if (existingImages.length + files.length + valid.length > 6) {
      setError('A listing can include up to 6 images.')
      return
    }
    setError('')
    const additions = valid.map((file) => {
      const preview = URL.createObjectURL(file)
      previewsRef.current.add(preview)
      return { file, preview }
    })
    setFiles((current) => [...current, ...additions])
  }

  function removeNewImage(preview) {
    URL.revokeObjectURL(preview)
    previewsRef.current.delete(preview)
    setFiles((current) => current.filter((entry) => entry.preview !== preview))
  }

  function updatePreference(preference) {
    setForm((current) => {
      const contactPreferences = current.contactPreferences.includes(preference)
        ? current.contactPreferences.filter((item) => item !== preference)
        : [...current.contactPreferences, preference]
      return { ...current, contactPreferences: contactPreferences.length ? contactPreferences : ['chat'] }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!editing && files.length === 0) {
      setError('Add at least one photo so people can see your find.')
      return
    }
    setSaving(true)
    setError('')
    const data = new FormData()
    for (const [key, value] of Object.entries(form)) {
      if (key === 'contactPreferences') value.forEach((preference) => data.append(key, preference))
      else data.set(key, String(value))
    }
    files.forEach(({ file }) => data.append('images', file))
    if (editing) data.set('existingImages', JSON.stringify(existingImages))

    try {
      const result = editing ? await updateProduct(id, data) : await createProduct(data)
      toast.success(result.message || 'Your listing has been saved.')
      navigate('/profile')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not save your listing.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <><Navbar /><div className="detail-loading">Loading your listing…</div><Footer /></>

  return (
    <>
      <Navbar />
      <main className="listing-form-page page-gutter">
        <Link className="back-link" to="/profile"><ArrowLeft size={16} /> Back to your listings</Link>
        <div className="listing-form-intro"><span className="eyebrow">{editing ? 'A GOOD THING, UPDATED' : 'MAKE A LITTLE ROOM'}</span><h1>{editing ? 'Edit your listing.' : 'Give it another go.'}</h1><p>A few lovely details help your next person find it.</p></div>
        <div className="listing-form-layout">
          <form className="listing-form" onSubmit={handleSubmit}>
            <section className="listing-form-section">
              <span className="form-section-number">01</span><div className="form-section-content"><h2>Show us what you’ve got</h2><p>The right details help the right person find you.</p>
                <label>Product title<input name="title" value={form.title} onChange={updateField} required minLength={4} maxLength={120} placeholder="A short, lovely description" /></label>
                <div className="form-grid-two">
                  <label>Category<select name="category" value={form.category} onChange={updateField} required><option value="">Choose one</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                  <label>Brand <span className="optional-label">optional</span><input name="brand" value={form.brand} onChange={updateField} maxLength={80} placeholder="e.g. Sony" /></label>
                </div>
                <label>Description<textarea name="description" value={form.description} onChange={updateField} required minLength={15} maxLength={5000} rows={5} placeholder="What makes it special? Mention any details someone would love to know." /></label>
              </div>
            </section>
            <section className="listing-form-section">
              <span className="form-section-number">02</span><div className="form-section-content"><h2>Set a fair price</h2><p>Good things at good prices find homes faster.</p>
                <div className="form-grid-two"><label>Price (₹)<input name="price" type="number" min="1" step="1" value={form.price} onChange={updateField} required placeholder="0" /></label><label>Original price (₹) <span className="optional-label">optional</span><input name="originalPrice" type="number" min="1" step="1" value={form.originalPrice} onChange={updateField} placeholder="If you know it" /></label></div>
                <label>Condition<select name="condition" value={form.condition} onChange={updateField} required><option value="">Choose the closest fit</option>{conditions.map((condition) => <option key={condition}>{condition}</option>)}</select></label>
                <label className="toggle-row"><input type="checkbox" name="negotiable" checked={form.negotiable} onChange={updateField} /><span><b>Open to offers</b><small>Let buyers know you’re happy to negotiate.</small></span><span className="toggle-switch" /></label>
              </div>
            </section>
            <section className="listing-form-section">
              <span className="form-section-number">03</span><div className="form-section-content"><h2>Where it’s waiting</h2><p>Keep it neighborhood-friendly.</p><label>Location<input name="location" value={form.location} onChange={updateField} required minLength={2} maxLength={100} placeholder="Neighborhood, city" /></label>
              <div className="contact-options"><span>How can someone reach you?</span>{[['chat', 'ReVendo messages'], ['phone', 'Phone (shared only after you agree)']].map(([value, label]) => <label key={value}><input type="checkbox" checked={form.contactPreferences.includes(value)} onChange={() => updatePreference(value)} />{label}</label>)}</div>
              </div>
            </section>
            <section className="listing-form-section">
              <span className="form-section-number">04</span><div className="form-section-content"><h2>Show it in its best light</h2><p>Clear photos make all the difference. Add up to 6.</p>
                <div className="listing-image-previews">
                  {existingImages.map((image) => <div className="listing-preview" key={image}><img src={getImageUrl(image)} alt="Current listing" /><button type="button" aria-label="Remove image" onClick={() => setExistingImages((current) => current.filter((item) => item !== image))}><X size={15} /></button></div>)}
                  {files.map(({ preview }) => <div className="listing-preview" key={preview}><img src={preview} alt="Selected listing" /><button type="button" aria-label="Remove image" onClick={() => removeNewImage(preview)}><X size={15} /></button></div>)}
                  {existingImages.length + files.length < 6 && <button className="add-image-tile" type="button" onClick={() => inputRef.current?.click()}><ImagePlus size={22} /><span>Add photos</span><small>JPEG, PNG or WebP</small></button>}
                </div>
                <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={chooseImages} />
              </div>
            </section>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <div className="listing-form-actions"><span><Check size={15} /> Safe, secure, and reviewed before it goes live.</span><button className="sell-account-button" type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Submit listing'} <ArrowRight size={15} /></button></div>
          </form>
          <aside className="listing-sidebar">
            <span className="listing-sidebar-icon"><Camera size={19} /></span><h3>Good photos get<br />good attention.</h3><p>Use natural light, a clean background, and show any little imperfections. Honest listings make the best matches.</p><div className="listing-tips"><span><Check size={14} /> A few angles</span><span><Check size={14} /> True-to-life color</span><span><Check size={14} /> No personal details in frame</span></div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}
