import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, BadgeCheck, CircleDollarSign, Clock3, MapPin, Pencil, Package, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'
import { deleteProduct, getMyProducts, updateProductStatus } from '../services/api'
import { formatPostedTime, formatPrice, getImageUrl } from '../utils/format'

const statuses = ['All', 'Active', 'Pending', 'Sold', 'Rejected']

function ListingRow({ product, onChanged }) {
  const [busy, setBusy] = useState(false)

  async function markAsSold() {
    setBusy(true)
    try {
      await updateProductStatus(product._id, 'Sold')
      toast.success('Marked as sold.')
      onChanged()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update this listing.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!window.confirm(`Delete “${product.title}”? This cannot be undone.`)) return
    setBusy(true)
    try {
      await deleteProduct(product._id)
      toast.success('Listing deleted.')
      onChanged()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete this listing.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="listing-row">
      <img src={getImageUrl(product.images?.[0])} alt="" />
      <div className="listing-row-copy">
        <span className={`status-chip status-${product.status.toLowerCase()}`}>{product.status}</span>
        {product.status === 'Active'
          ? <Link className="listing-row-title" to={`/products/${product._id}`}>{product.title}</Link>
          : product.status === 'Sold'
            ? <span className="listing-row-title">{product.title}</span>
            : <Link className="listing-row-title" to={`/listings/${product._id}/edit`}>{product.title}</Link>}
        <span className="listing-row-price">{formatPrice(product.price)} <small>· {formatPostedTime(product.createdAt)}</small></span>
      </div>
      <div className="listing-row-actions">
        {product.status !== 'Sold' && <Link className="row-icon-button" to={`/listings/${product._id}/edit`} aria-label={`Edit ${product.title}`}><Pencil size={15} /></Link>}
        {product.status === 'Active' && <button className="row-icon-button" type="button" disabled={busy} onClick={markAsSold} aria-label={`Mark ${product.title} as sold`}><BadgeCheck size={16} /></button>}
        <button className="row-icon-button row-delete" type="button" disabled={busy} onClick={remove} aria-label={`Delete ${product.title}`}><Trash2 size={15} /></button>
      </div>
    </article>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [activeStatus, setActiveStatus] = useState('All')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProducts = useCallback(async () => {
    try {
      const result = await getMyProducts({ limit: 40 })
      setProducts(result.data)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load your listings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    getMyProducts({ limit: 40 })
      .then((result) => { if (active) { setProducts(result.data); setError('') } })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load your listings.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const activeCount = products.filter((product) => product.status === 'Active').length
  const soldCount = products.filter((product) => product.status === 'Sold').length
  const visibleProducts = activeStatus === 'All' ? products : products.filter((product) => product.status === activeStatus)

  return (
    <>
      <Navbar />
      <main className="account-page page-gutter">
        <div className="account-welcome">
          <div className="account-avatar">{user?.profileImage ? <img src={getImageUrl(user.profileImage)} alt="" /> : user?.name?.[0]?.toUpperCase()}</div>
          <div className="account-welcome-copy"><span className="eyebrow">YOUR REVENDO SPACE</span><h1>Good to see you, {user?.name?.split(' ')[0]}.</h1><p>Your finds, your listings, your little piece of the circle.</p></div>
          <Link className="account-edit-button" to="/profile/edit"><Pencil size={15} /> Edit profile</Link>
        </div>
        <div className="account-layout">
          <aside className="account-sidebar">
            <div className="account-sidebar-user"><b>{user?.name}</b><span>{user?.email}</span></div>
            <Link className="account-side-active" to="/profile"><Package size={16} /> My listings</Link>
            <Link to="/profile/edit"><Pencil size={16} /> Profile settings</Link>
            <Link to="/wishlist"><BadgeCheck size={16} /> Saved finds</Link>
            <Link to="/orders"><CircleDollarSign size={16} /> Orders</Link>
            <Link to="/profile/password"><ShieldCheck size={16} /> Password & security</Link>
            <div className="seller-ready"><span><Clock3 size={15} /> Seller since</span><b>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Today'}</b></div>
          </aside>
          <section className="account-main">
            <div className="account-stats">
              <div><span>My listings</span><b>{products.length}</b><Package size={17} /></div>
              <div><span>Live right now</span><b>{activeCount}</b><MapPin size={17} /></div>
              <div><span>Passed along</span><b>{soldCount}</b><CircleDollarSign size={17} /></div>
            </div>
            <div className="account-listings-head"><div><span className="eyebrow">A LITTLE LIFE IN YOUR LISTINGS</span><h2>My listings</h2></div><Link className="sell-account-button" to="/sell"><Plus size={16} /> List a good thing</Link></div>
            <div className="listing-tabs" role="tablist" aria-label="Filter my listings">
              {statuses.map((status) => <button key={status} role="tab" aria-selected={activeStatus === status} className={activeStatus === status ? 'active' : ''} onClick={() => setActiveStatus(status)} type="button">{status}</button>)}
            </div>
            {loading && <div className="account-empty">Gathering your listings…</div>}
            {error && !loading && <div className="account-error">{error}<button type="button" onClick={() => { setLoading(true); loadProducts() }}>Try again</button></div>}
            {!loading && !error && visibleProducts.length === 0 && <div className="account-empty"><Package size={25} /><b>No {activeStatus === 'All' ? '' : `${activeStatus.toLowerCase()} `}listings yet.</b><span>When you list something lovely, it’ll show up here.</span><Link to="/sell">List your first find <ArrowRight size={14} /></Link></div>}
            {!loading && !error && visibleProducts.length > 0 && <div className="listing-rows">{visibleProducts.map((product) => <ListingRow key={product._id} product={product} onChanged={() => { setLoading(true); loadProducts() }} />)}</div>}
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
