import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Bell, ChevronDown, Heart, MapPin, Menu, Search, ShoppingBag, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/useAuth'

export default function Navbar() {
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  function search(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('search', query.trim())
    navigate(`/browse${params.size ? `?${params}` : ''}`)
    setMenuOpen(false)
  }

  return (
    <header className="site-header">
      <div className="announcement">
        <span>Good things deserve another go.</span>
        <span className="announcement-link">Buy better. Sell smarter. <ArrowRight size={13} /></span>
      </div>
      <div className="nav-shell">
        <div className="nav-main">
          <Link className="brand" to="/" aria-label="ReVendo home">
            <span className="brand-mark">r<span>.</span></span>
            <span className="brand-name">revendo</span>
          </Link>
          <form className="nav-search" onSubmit={search}>
            <Search size={18} strokeWidth={2} />
            <input
              aria-label="Search products"
              placeholder="Find something you’ll love"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit">Search</button>
          </form>
          <div className="nav-actions">
            <button className="location-button" type="button" aria-label="Browse near Bengaluru" onClick={() => navigate('/browse?location=Bengaluru')}>
              <MapPin size={17} />
              <span>Bengaluru</span>
              <ChevronDown size={14} />
            </button>
            <Link className="nav-icon-link" to={user ? '/wishlist' : '/login'} aria-label="Saved finds">
              <Heart size={20} />
            </Link>
            <Link className="nav-icon-link" to={user ? '/cart' : '/login'} aria-label="Shopping bag">
              <ShoppingBag size={20} />
            </Link>
            {user && <Link className="nav-icon-link" to="/notifications" aria-label="Notifications"><Bell size={19} /></Link>}
            {user
              ? <Link className="login-link" to="/profile">{user.name.split(' ')[0]}</Link>
              : <Link className="login-link" to="/login">Log in</Link>}
            {user && <button className="logout-link" type="button" onClick={() => logout().then(() => toast.success('You are signed out.')).catch(() => toast.error('Could not sign out.'))}>Sign out</button>}
            <Link className="sell-button" to={user ? '/sell' : '/login'}>Sell an item <ArrowRight size={15} /></Link>
          </div>
          <button
            className="mobile-menu-button"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
        <nav className="category-nav" aria-label="Main navigation">
          <Link to="/browse">Explore all</Link>
          <Link to="/browse?category=Electronics">Electronics</Link>
          <Link to="/browse?category=Fashion">Fashion</Link>
          <Link to="/browse?category=Furniture">Home & living</Link>
          <Link to="/browse?category=Gaming">Gaming</Link>
          <Link to="/browse?category=Accessories">Accessories</Link>
          <span className="nav-spacer" />
          <span className="nav-promise"><span /> Thoughtful finds, always</span>
        </nav>
        {menuOpen && (
          <div className="mobile-menu">
            <form className="mobile-search" onSubmit={search}>
              <Search size={18} />
              <input
                aria-label="Search products"
                placeholder="Search ReVendo"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="submit">Go</button>
            </form>
            <Link onClick={() => setMenuOpen(false)} to="/browse">Explore everything</Link>
            <Link onClick={() => setMenuOpen(false)} to="/browse?category=Electronics">Electronics</Link>
            <Link onClick={() => setMenuOpen(false)} to="/browse?category=Fashion">Fashion</Link>
            <Link onClick={() => setMenuOpen(false)} to="/browse?category=Furniture">Home & living</Link>
            {user ? <Link onClick={() => setMenuOpen(false)} to="/profile">My account</Link> : <Link onClick={() => setMenuOpen(false)} to="/login">Sign in</Link>}
            {user && <button className="mobile-signout" type="button" onClick={() => logout().then(() => { setMenuOpen(false); toast.success('You are signed out.') }).catch(() => toast.error('Could not sign out.'))}>Sign out</button>}
            <Link onClick={() => setMenuOpen(false)} to={user ? '/sell' : '/login'}>Sell an item</Link>
          </div>
        )}
      </div>
    </header>
  )
}
