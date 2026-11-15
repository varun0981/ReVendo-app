import { ArrowUpRight, Heart, MapPin } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/useAuth'
import { addWishlistItem } from '../services/api'
import { formatPostedTime, formatPrice, getImageUrl } from '../utils/format'

export default function ProductCard({ product, compact = false }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function saveProduct() {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const result = await addWishlistItem(product._id)
      toast.success(result.message)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save this find.')
    }
  }

  return (
    <article className={`product-card${compact ? ' product-card-compact' : ''}`}>
      <Link className="product-image-link" to={`/products/${product._id}`} aria-label={`View ${product.title}`}>
        <div className="product-image-wrap">
          <img
            className="product-image"
            src={getImageUrl(product.images?.[0] || 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85')}
            alt={product.title}
            loading="lazy"
          />
          {product.condition === 'Like New' && <span className="image-label">Like new</span>}
          <span className="image-arrow"><ArrowUpRight size={18} /></span>
        </div>
      </Link>
      <div className="product-info">
        <div className="product-heading">
          <span className="product-category">{product.category}</span>
          <button className="wishlist-button" type="button" onClick={saveProduct} aria-label={`Save ${product.title}`}>
            <Heart size={17} />
          </button>
        </div>
        <Link className="product-title" to={`/products/${product._id}`}>{product.title}</Link>
        <div className="product-price-row">
          <span className="product-price">{formatPrice(product.price)}</span>
          {product.originalPrice > product.price && (
            <span className="product-original-price">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
        <div className="product-meta">
          <span><MapPin size={13} /> {product.location?.split(',')[0]}</span>
          <span>{formatPostedTime(product.createdAt)}</span>
        </div>
      </div>
    </article>
  )
}
