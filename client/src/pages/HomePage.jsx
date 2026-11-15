import { useEffect, useState } from 'react'
import {
  ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, Camera, ChevronRight,
  CircleCheck, Footprints, Headphones, Heart, Leaf, MapPin, PackageCheck,
  Search, ShieldCheck, Sparkles, Truck,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { ProductGrid, ProductSkeletons } from '../components/ProductGrid'
import { getProducts } from '../services/api'

const categories = [
  { name: 'Tech & gadgets', category: 'Electronics', icon: Headphones, count: 'Find your next favorite' },
  { name: 'Style & fashion', category: 'Fashion', icon: Footprints, count: 'Wear it your way' },
  { name: 'Home & living', category: 'Furniture', icon: Sparkles, count: 'Make room for good' },
  { name: 'Cameras', category: 'Electronics', icon: Camera, count: 'Ready for a new frame' },
]

function SectionHeading({ eyebrow, title, action = 'Explore all', to = '/browse' }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <Link className="text-link" to={to}>{action}<ArrowRight size={16} /></Link>
    </div>
  )
}

function Hero({ onSearch }) {
  const [query, setQuery] = useState('')
  return (
    <section className="hero-section" id="top">
      <div className="hero-copy">
        <span className="hero-kicker"><span className="kicker-spark">✳</span> A marketplace for good things</span>
        <h1>Good finds.<br /><span>Better second</span><br />lives.</h1>
        <p className="hero-description">The things you love, finding their way to someone who will love them next. Discover pre-loved pieces with a little more meaning.</p>
        <form className="hero-search" onSubmit={(event) => { event.preventDefault(); onSearch(query) }}>
          <Search size={20} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What are you looking for?" aria-label="Search the marketplace" />
          <button type="submit">Find it <ArrowRight size={16} /></button>
        </form>
        <div className="hero-trending"><span>Trending:</span><Link to="/browse?search=camera">film cameras</Link><Link to="/browse?search=lamp">ceramic lamps</Link><Link to="/browse?search=denim">good denim</Link></div>
        <a className="hero-scroll" href="#fresh-finds"><span><ArrowDown size={14} /></span> Scroll to explore</a>
      </div>
      <div className="hero-visual">
        <div className="hero-photo">
          <img src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1500&q=90" alt="Thoughtfully styled home with pre-loved objects" />
          <div className="hero-photo-caption"><span>MADE TO BE LOVED AGAIN</span><span>01 — 04</span></div>
        </div>
        <div className="hero-sticker"><span>♻</span><small>GOOD THINGS<br />CIRCLE BACK</small></div>
        <div className="hero-proof"><span className="proof-icon"><Leaf size={18} /></span><span><b>Less waste.</b><br />More lovely things.</span></div>
        <div className="hero-index">THE RE-LOVE MARKET <span>✳</span> EST. 2025</div>
      </div>
    </section>
  )
}

function CategorySection() {
  return (
    <section className="category-section page-gutter">
      <div className="category-intro">
        <span className="eyebrow">A little bit of everything</span>
        <h2>Find your kind<br />of <em>pre-loved.</em></h2>
        <Link className="text-link" to="/browse">Browse all categories <ArrowRight size={16} /></Link>
      </div>
      <div className="category-tiles">
        {categories.map(({ name, category, icon: Icon, count }, index) => (
          <Link className={`category-tile category-tile-${index + 1}`} to={`/browse?category=${encodeURIComponent(category)}`} key={name}>
            <span className="category-tile-icon"><Icon size={20} strokeWidth={1.7} /></span>
            <span className="category-tile-copy"><b>{name}</b><small>{count}</small></span>
            <ArrowUpRight className="category-arrow" size={18} />
          </Link>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { number: '01', title: 'Find your next thing', body: 'Browse thoughtful finds from real people, right around the corner.', icon: Search },
    { number: '02', title: 'Make it yours', body: 'Ask a question, agree a price, and make a good thing yours.', icon: Heart },
    { number: '03', title: 'Pass it forward', body: 'Give what you no longer need a new home and a new story.', icon: PackageCheck },
  ]
  return (
    <section className="how-section page-gutter" id="how-it-works">
      <div className="how-header">
        <div><span className="eyebrow">A better kind of marketplace</span><h2>Good things go<br />around <em>and around.</em></h2></div>
        <p>Buying pre-loved should feel just as lovely as finding something brand new. Here’s how we make a little circular magic.</p>
      </div>
      <div className="how-steps">
        {steps.map(({ number, title, body, icon: Icon }) => (
          <div className="how-step" key={number}>
            <div className="step-top"><span>{number}</span><Icon size={23} strokeWidth={1.5} /></div>
            <h3>{title}</h3><p>{body}</p>
            <span className="step-line" />
          </div>
        ))}
      </div>
      <div className="how-signoff"><span><CircleCheck size={17} /> Better for your budget. Kinder to the planet.</span><span>That’s a good deal.</span></div>
    </section>
  )
}

function SellCallout() {
  return (
    <section className="sell-callout page-gutter" id="sell-cta">
      <div className="sell-callout-inner">
        <div className="sell-copy">
          <span className="eyebrow">Your shelf called</span>
          <h2>Someone out there<br />is looking for <em>your thing.</em></h2>
          <p>Make a little space, make someone’s day. Listing is easy, and your old favorite deserves a new story.</p>
          <Link to="/sell" className="sell-cta-button">I have good things <ArrowRight size={16} /></Link>
          <span className="sell-cta-note"><ShieldCheck size={15} /> Free to list. Always.</span>
        </div>
        <div className="sell-art">
          <img src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1200&q=85" alt="A well-loved chair ready for a new home" />
          <span className="sell-art-tag"><BadgeCheck size={15} /> Give it another go</span>
          <span className="sell-art-number">NO. 001 <span>↗</span></span>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    getProducts({ limit: 4, sort: 'newest' })
      .then((result) => { if (active) setProducts(result.data) })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'We could not load listings. Check that the ReVendo API and MongoDB are running.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reload])

  function searchProducts(query) {
    const trimmed = query.trim()
    if (!trimmed) {
      toast.error('Type something to start exploring.')
      return
    }
    navigate(`/browse?search=${encodeURIComponent(trimmed)}`)
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero onSearch={searchProducts} />
        <section className="fresh-section page-gutter" id="fresh-finds">
          <SectionHeading eyebrow="JUST FOUND THEIR WAY HERE" title="Fresh finds, first dibs." action="See everything" />
          {loading && <ProductSkeletons />}
          {error && !loading && (
            <div className="inline-error">
              <span>{error}</span>
                <button type="button" onClick={() => { setLoading(true); setError(''); setReload((current) => current + 1) }}>Try again</button>
            </div>
          )}
          {!loading && !error && <ProductGrid products={products} />}
        </section>
        <CategorySection />
        <section className="neighborhood-band">
          <div className="neighborhood-copy">
            <span className="eyebrow">A little closer to home</span>
            <h2>Lovely things.<br /><em>Just around the corner.</em></h2>
            <p>Find thoughtful pieces from people in your neighborhood. Meet locally, discover more, and give good things another go.</p>
            <Link className="light-link" to="/browse">Explore near you <ArrowRight size={16} /></Link>
          </div>
          <div className="neighborhood-map">
            <div className="map-lines"><span /><span /><span /><span /></div>
            <div className="map-pin map-pin-one"><MapPin size={19} fill="currentColor" /></div>
            <div className="map-pin map-pin-two"><MapPin size={19} fill="currentColor" /></div>
            <div className="map-pin map-pin-three"><MapPin size={19} fill="currentColor" /></div>
            <div className="map-card"><span className="map-card-pulse" /><div><b>Good things nearby</b><small>Find something lovely around you</small></div><ChevronRight size={17} /></div>
            <span className="map-coordinate">12°58′ N &nbsp; 77°35′ E</span>
          </div>
          <Truck className="neighborhood-icon" size={22} />
        </section>
        <HowItWorks />
        <SellCallout />
      </main>
      <Footer />
    </>
  )
}
