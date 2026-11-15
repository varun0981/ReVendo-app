import { useEffect, useState } from 'react'
import { Check, ExternalLink, Search, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { deleteAdminProduct, getAdminProducts, moderateAdminProduct } from '../../services/adminApi'
import { formatPrice, getImageUrl } from '../../utils/format'

const statuses = ['', 'Pending', 'Active', 'Sold', 'Rejected']

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('Pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    let active = true
    getAdminProducts({ search, status, limit: 100 })
      .then((result) => { if (active) setProducts(result.data) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load listings.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [search, status])

  async function moderate(product, action) {
    const reason = action === 'reject' ? window.prompt('A brief note for the seller (optional):', '') ?? null : ''
    if (reason === null) return
    setBusyId(product._id)
    try {
      await moderateAdminProduct(product._id, action, reason)
      setProducts((current) => current.filter((item) => item._id !== product._id))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not moderate this listing.')
    } finally {
      setBusyId('')
    }
  }

  async function remove(product) {
    if (!window.confirm(`Permanently remove “${product.title}”?`)) return
    setBusyId(product._id)
    try {
      await deleteAdminProduct(product._id)
      setProducts((current) => current.filter((item) => item._id !== product._id))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not remove this listing.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <section className="admin-section-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">A THOUGHTFUL MARKETPLACE STARTS HERE</span><h1>Listing management.</h1><p>Review new finds, approve good listings, and handle content that needs attention.</p></div></div>
      <div className="admin-list-toolbar"><label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search listings or brands" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter listings">{statuses.map((value) => <option value={value} key={value}>{value || 'All statuses'}</option>)}</select><span>{products.length} listings</span></div>
      {error && <div className="admin-error">{error}</div>}
      {loading ? <div className="admin-loading">Reviewing the marketplace…</div> : <div className="admin-product-table">{products.map((product) => <article className="admin-moderation-card" key={product._id}><img className="admin-moderation-image" src={getImageUrl(product.images?.[0])} alt={product.title} /><div className="admin-moderation-copy"><div><span className={`status-chip status-${product.status.toLowerCase()}`}>{product.status}</span><span className="admin-moderation-category">{product.category} · {product.condition}</span></div><Link to={`/products/${product._id}`}>{product.title} <ExternalLink size={12} /></Link><p>{product.description}</p><small>Seller: {product.seller?.name || 'Unknown'} · Listed {new Date(product.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</small>{product.moderationNote && <div className="moderation-note">Note to seller: {product.moderationNote}</div>}</div><div className="admin-moderation-side"><b>{formatPrice(product.price)}</b>{['Pending', 'Rejected'].includes(product.status) && <div className="admin-moderation-actions"><button type="button" disabled={busyId === product._id} onClick={() => moderate(product, 'approve')}><Check size={14} /> Approve</button><button type="button" disabled={busyId === product._id} onClick={() => moderate(product, 'reject')}><X size={14} /> Reject</button></div>}<button className="admin-icon-danger" type="button" disabled={busyId === product._id} onClick={() => remove(product)} aria-label={`Delete ${product.title}`}><Trash2 size={15} /></button></div></article>)}{products.length === 0 && !error && <div className="admin-empty-small">Nothing here right now. A nice quiet queue.</div>}</div>}
    </section>
  )
}
