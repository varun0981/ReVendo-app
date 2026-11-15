import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Heart, MapPin, ShieldCheck, ShoppingBag, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'
import { addCartItem, addWishlistItem, contactSeller, getProduct, reportProduct } from '../services/api'
import { formatPostedTime, formatPrice, getImageUrl } from '../utils/format'

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [activeImage, setActiveImage] = useState(0)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('Inappropriate')
  const [reportDescription, setReportDescription] = useState('')
  const [reportError, setReportError] = useState('')
  const [reporting, setReporting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getProduct(id)
      .then((result) => { if (active) setProduct(result) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load this item.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  async function runForSignedInUser(action) {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/products/${id}` } } })
      return null
    }
    try {
      return await action()
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'That action could not be completed.')
      return null
    }
  }

  async function addToBag(continueToCheckout = false) {
    const result = await runForSignedInUser(() => addCartItem(id))
    if (!result) return
    toast.success(result.message)
    if (continueToCheckout) navigate('/checkout')
  }

  async function saveFind() {
    const result = await runForSignedInUser(() => addWishlistItem(id))
    if (result) toast.success(result.message)
  }

  async function askSeller() {
    const result = await runForSignedInUser(() => contactSeller(id))
    if (result) toast.success(result.message)
  }

  async function submitReport(event) {
    event.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    setReporting(true)
    setReportError('')
    try {
      const result = await reportProduct(id, { reason: reportReason, description: reportDescription })
      toast.success(result.message)
      setReportOpen(false)
      setReportDescription('')
    } catch (requestError) {
      setReportError(requestError.response?.data?.message || 'Could not submit this report.')
    } finally {
      setReporting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="product-page page-gutter">
        <Link className="back-link" to="/browse"><ArrowLeft size={16} /> Back to exploring</Link>
        {loading && <div className="detail-loading">Loading this lovely find…</div>}
        {error && !loading && <div className="inline-error">{error}<Link to="/browse">Browse other finds</Link></div>}
        {product && (
          <div className="product-detail">
            <div>
              <div className="detail-image-wrap"><img src={getImageUrl(product.images?.[activeImage])} alt={product.title} /></div>
              {product.images?.length > 1 && <div className="detail-thumbnails">{product.images.map((image, index) => <button key={image} type="button" className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)} aria-label={`View image ${index + 1}`}><img src={getImageUrl(image)} alt="" /></button>)}</div>}
            </div>
            <div className="detail-copy">
              <span className="eyebrow">{product.category} <span>·</span> {product.condition}</span>
              <h1>{product.title}</h1>
              <div className="detail-price">{formatPrice(product.price)}{product.originalPrice > product.price && <del>{formatPrice(product.originalPrice)}</del>}</div>
              <p className="detail-description">{product.description}</p>
              <div className="detail-facts"><span><MapPin size={16} />{product.location}</span><span>Listed {formatPostedTime(product.createdAt)}</span></div>
              <div className="seller-card">
                <div className="seller-avatar">{product.seller?.profileImage ? <img src={getImageUrl(product.seller.profileImage)} alt="" /> : product.seller?.name?.[0] || 'R'}</div>
                <div><b>{product.seller?.name || 'ReVendo seller'}</b><span>{product.seller?.location || product.location} · Good things, shared</span></div>
                {product.seller?._id && <Link className="seller-view-link" to={`/sellers/${product.seller._id}`}>View seller</Link>}
                <ShieldCheck size={18} />
              </div>
              <div className="detail-actions">
                {product.seller?._id === user?.id
                  ? <Link className="detail-buy-button" to={`/listings/${product._id}/edit`}>Edit your listing <ArrowUpRight size={17} /></Link>
                  : <button className="detail-buy-button" type="button" onClick={askSeller}>Ask seller <ArrowUpRight size={17} /></button>}
                <button className="detail-save-button" type="button" onClick={saveFind}><Heart size={18} /> Save</button>
              </div>
              {product.seller?._id !== user?.id && <div className="detail-actions detail-secondary-actions"><button className="detail-buy-button detail-cart-button" type="button" onClick={() => addToBag()}><ShoppingBag size={16} /> Add to bag</button><button className="detail-save-button detail-buy-now-button" type="button" onClick={() => addToBag(true)}>Buy now</button></div>}
              <div className="detail-note"><ShieldCheck size={16} /><span>Keep conversations and meetups safe. Never share sensitive information.</span></div>
              <button className="report-listing-link" type="button" onClick={() => setReportOpen(true)}>Report this listing</button>
            </div>
          </div>
        )}
        {reportOpen && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReportOpen(false) }}><form className="report-dialog" onSubmit={submitReport} role="dialog" aria-modal="true" aria-labelledby="report-title"><button className="dialog-close" type="button" onClick={() => setReportOpen(false)} aria-label="Close report form"><X size={18} /></button><span className="eyebrow">KEEPING THE CIRCLE THOUGHTFUL</span><h2 id="report-title">Report this listing.</h2><p>Tell us what’s concerning. Reports are reviewed by the ReVendo team.</p><label>Reason<select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>{['Inappropriate', 'Scam or fraud', 'Counterfeit', 'Incorrect information', 'Other'].map((reason) => <option key={reason}>{reason}</option>)}</select></label><label>Anything else? <span>optional</span><textarea rows={4} maxLength={1000} value={reportDescription} onChange={(event) => setReportDescription(event.target.value)} placeholder="A little context helps our team review it." /></label>{reportError && <p className="auth-error" role="alert">{reportError}</p>}<button className="commerce-primary" type="submit" disabled={reporting}>{reporting ? 'Sending…' : 'Send report'} <ArrowUpRight size={15} /></button></form></div>}
      </main>
      <Footer />
    </>
  )
}
