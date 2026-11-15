import { useEffect, useState } from 'react'
import { ArrowLeft, MapPin, Package, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { ProductGrid, ProductSkeletons } from '../components/ProductGrid'
import { getPublicProfile, getUserListings } from '../services/api'
import { getImageUrl } from '../utils/format'

export default function SellerProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getPublicProfile(id), getUserListings(id, { limit: 24 })])
      .then(([seller, listings]) => { if (active) { setProfile(seller); setProducts(listings.data) } })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load this seller.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  return (
    <>
      <Navbar />
      <main className="seller-page page-gutter">
        <Link className="back-link" to="/browse"><ArrowLeft size={16} /> Back to exploring</Link>
        {loading && <div className="detail-loading">Finding this seller…</div>}
        {error && !loading && <div className="inline-error">{error}<Link to="/browse">Explore other finds</Link></div>}
        {profile && (
          <>
            <section className="seller-profile-card">
              <div className="seller-profile-avatar">{profile.profileImage ? <img src={getImageUrl(profile.profileImage)} alt="" /> : profile.name[0]}</div>
              <div className="seller-profile-info"><span className="eyebrow">A GOOD NEIGHBOR ON REVENDO</span><h1>{profile.name}</h1><p>{profile.bio || 'Sharing good things and making a little more room for the next.'}</p><div className="seller-profile-meta">{profile.location && <span><MapPin size={14} />{profile.location}</span>}<span><ShieldCheck size={14} />Member since {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span></div></div>
              <div className="seller-profile-stats"><span><Package size={16} /> {profile.totalListings} live finds</span><span>{profile.totalSold} passed along</span></div>
            </section>
            <section className="seller-listings">
              <div className="section-heading"><div><span className="eyebrow">FROM {profile.name.split(' ')[0].toUpperCase()}</span><h2>Good things, shared.</h2></div></div>
              {loading ? <ProductSkeletons /> : <ProductGrid products={products} />}
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
