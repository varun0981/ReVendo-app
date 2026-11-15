import { ArrowUpRight, Instagram, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-about">
          <Link className="brand footer-brand" to="/">
            <span className="brand-mark">r<span>.</span></span>
            <span className="brand-name">revendo</span>
          </Link>
          <p>Give good things a second life.<br />A little more thoughtful, a lot more you.</p>
          <a className="footer-social" href="mailto:hello@revendo.local"><Mail size={17} /> Say hello</a>
        </div>
        <div className="footer-links">
          <div><h4>Discover</h4><Link to="/browse">Shop everything</Link><Link to="/browse?category=Electronics">Electronics</Link><Link to="/browse?category=Fashion">Style & accessories</Link></div>
          <div><h4>Make a difference</h4><a href="/#how-it-works">How it works</a><Link to="/sell">Start selling</Link><a href="/#how-it-works">Our promise</a></div>
          <div><h4>ReVendo</h4><Link to="/about">About us</Link><Link to="/contact">Contact</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div>
        </div>
        <div className="footer-note">
          <span>GOOD THINGS CIRCLE BACK.</span>
          <a href="#top" aria-label="Back to top"><ArrowUpRight size={19} /></a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2025 ReVendo Marketplace</span>
        <span>Made for a more circular world <span className="footer-spark">✳</span></span>
        <a href="https://instagram.com" aria-label="Instagram"><Instagram size={16} /></a>
      </div>
    </footer>
  )
}
