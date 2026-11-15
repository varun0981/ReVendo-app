import { useEffect, useState } from 'react'
import { ArrowRight, ArrowUpRight, MapPin, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { getCart, removeCartItem } from '../services/api'
import { formatPrice, getImageUrl } from '../utils/format'

export default function CartPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadCart() {
    try {
      setProducts(await getCart())
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load your bag.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getCart()
      .then((result) => {
        if (active) {
          setProducts(result)
          setError('')
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load your bag.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  async function remove(product) {
    try {
      await removeCartItem(product._id)
      setProducts((current) => current.filter((item) => item._id !== product._id))
      toast.success('Removed from your bag.')
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not remove this find.')
    }
  }

  const total = products.reduce((sum, product) => sum + product.price, 0)

  return (
    <>
      <Navbar />
      <main className="commerce-page page-gutter">
        <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><b>Your bag</b></div>
        <div className="commerce-heading"><div><span className="eyebrow">GOOD THINGS, TOGETHER</span><h1>Your bag.</h1><p>Every find here is one of a kind, so don’t wait too long.</p></div><span className="bag-count">{products.length} {products.length === 1 ? 'find' : 'finds'}</span></div>
        {loading && <div className="commerce-message">Gathering your finds…</div>}
        {error && !loading && <div className="inline-error">{error}<button type="button" onClick={() => { setLoading(true); loadCart() }}>Try again</button></div>}
        {!loading && !error && products.length === 0 && <div className="commerce-empty"><span className="commerce-empty-mark">✳</span><h2>Your bag has room for something lovely.</h2><p>Come across a good find while exploring? Save it here for later.</p><Link className="commerce-primary" to="/browse">Find something lovely <ArrowRight size={15} /></Link></div>}
        {!loading && !error && products.length > 0 && (
          <div className="cart-layout">
            <section className="cart-items">{products.map((product) => (
              <article className="cart-row" key={product._id}>
                <Link to={`/products/${product._id}`} className="cart-row-image"><img src={getImageUrl(product.images?.[0])} alt={product.title} /></Link>
                <div className="cart-row-info"><span className="eyebrow">{product.category} · {product.condition}</span><Link to={`/products/${product._id}`}><b>{product.title}</b></Link><span><MapPin size={13} />{product.location}</span><small>One of a kind · Quantity 1</small></div>
                <div className="cart-row-side"><b>{formatPrice(product.price)}</b><button type="button" onClick={() => remove(product)} aria-label={`Remove ${product.title}`}><Trash2 size={15} /> Remove</button></div>
              </article>
            ))}</section>
            <aside className="cart-summary"><span className="eyebrow">THE GOOD PART</span><h2>Order summary</h2><div className="summary-line"><span>{products.length} {products.length === 1 ? 'item' : 'items'}</span><b>{formatPrice(total)}</b></div><div className="summary-line"><span>Shipping</span><span>Arranged with seller</span></div><div className="summary-total"><span>Total</span><b>{formatPrice(total)}</b></div><p><span>✓</span> Choose cash on delivery or Razorpay test mode at checkout.</p><Link className="commerce-primary" to="/checkout">Continue to checkout <ArrowRight size={15} /></Link><Link className="continue-shopping" to="/browse"><ArrowUpRight size={14} /> Keep exploring</Link></aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
