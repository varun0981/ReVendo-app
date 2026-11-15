import { useEffect, useState } from 'react'
import { ArrowRight, Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { addCartItem, getWishlist, removeWishlistItem } from '../services/api'
import { formatPrice, getImageUrl } from '../utils/format'

export default function WishlistPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadWishlist() {
    try {
      setProducts(await getWishlist())
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load your saved finds.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getWishlist()
      .then((result) => {
        if (active) {
          setProducts(result)
          setError('')
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load your saved finds.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  async function remove(product) {
    try {
      await removeWishlistItem(product._id)
      setProducts((current) => current.filter((item) => item._id !== product._id))
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not remove this find.')
    }
  }

  async function addToBag(product) {
    try {
      const result = await addCartItem(product._id)
      toast.success(result.message)
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not add this find to your bag.')
    }
  }

  return (
    <>
      <Navbar />
      <main className="commerce-page page-gutter">
        <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><b>Saved finds</b></div>
        <div className="commerce-heading"><div><span className="eyebrow">THE GOOD THINGS YOU’RE THINKING ABOUT</span><h1>Your wishlist.</h1><p>A little collection of finds you’d love to give a second life.</p></div><span className="bag-count">{products.length} saved</span></div>
        {loading && <div className="commerce-message">Gathering your saved finds…</div>}
        {error && !loading && <div className="inline-error">{error}<button type="button" onClick={() => { setLoading(true); loadWishlist() }}>Try again</button></div>}
        {!loading && !error && products.length === 0 && <div className="commerce-empty"><span className="commerce-empty-mark"><Heart size={24} /></span><h2>Save a find for later.</h2><p>Tap the little heart on anything you love while you’re exploring.</p><Link className="commerce-primary" to="/browse">Explore the marketplace <ArrowRight size={15} /></Link></div>}
        {!loading && products.length > 0 && <div className="wishlist-list">{products.map((product) => <article className="wishlist-row" key={product._id}><Link className="wishlist-row-image" to={`/products/${product._id}`}><img src={getImageUrl(product.images?.[0])} alt={product.title} /></Link><div className="wishlist-row-copy"><span className="eyebrow">{product.category} · {product.condition}</span><Link to={`/products/${product._id}`}><b>{product.title}</b></Link><span>{product.location}</span><strong>{formatPrice(product.price)}</strong></div><div className="wishlist-row-actions"><button type="button" onClick={() => addToBag(product)}><ShoppingBag size={15} /> Add to bag</button><button type="button" onClick={() => remove(product)} aria-label={`Remove ${product.title} from wishlist`}><Trash2 size={15} /></button></div></article>)}</div>}
      </main>
      <Footer />
    </>
  )
}
