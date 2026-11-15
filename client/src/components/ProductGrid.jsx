import { ArrowRight, PackageOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'

export function ProductSkeletons({ count = 4 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }, (_, index) => (
        <div className="product-skeleton" key={index}>
          <div className="skeleton-image" />
          <div className="skeleton-line skeleton-short" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-price" />
        </div>
      ))}
    </div>
  )
}

export function ProductGrid({ products, compact = false }) {
  if (!products.length) {
    return (
      <div className="empty-state">
        <PackageOpen size={27} />
        <h3>No finds just yet</h3>
        <p>Try a different search or check back soon for fresh listings.</p>
        <Link to="/browse">Explore all items <ArrowRight size={15} /></Link>
      </div>
    )
  }

  return (
    <div className={`product-grid${compact ? ' product-grid-compact' : ''}`}>
      {products.map((product) => <ProductCard key={product._id} product={product} compact={compact} />)}
    </div>
  )
}
