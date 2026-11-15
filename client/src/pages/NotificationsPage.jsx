import { useEffect, useState } from 'react'
import { Bell, Check, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { getNotifications, markNotificationRead } from '../services/api'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getNotifications()
      .then((result) => { if (active) setNotifications(result.data) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load notifications.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function markRead(id) {
    try {
      const updated = await markNotificationRead(id)
      setNotifications((current) => current.map((item) => item._id === id ? updated : item))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update this notification.')
    }
  }

  return (
    <>
      <Navbar />
      <main className="commerce-page page-gutter">
        <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><b>Notifications</b></div>
        <div className="commerce-heading"><div><span className="eyebrow">LITTLE NOTES FROM THE CIRCLE</span><h1>Your notifications.</h1><p>Orders, updates, and good things to know.</p></div></div>
        {loading && <div className="commerce-message">Checking for updates…</div>}
        {error && !loading && <div className="inline-error">{error}</div>}
        {!loading && !error && notifications.length === 0 && <div className="commerce-empty"><span className="commerce-empty-mark"><Bell size={23} /></span><h2>All caught up.</h2><p>When something good happens, you’ll find a note here.</p></div>}
        {!loading && notifications.length > 0 && <div className="notification-list">{notifications.map((item) => <article className={`notification-card${item.read ? '' : ' unread'}`} key={item._id}><div className="notification-type-icon"><Bell size={16} /></div><div className="notification-copy"><b>{item.title}</b><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small></div>{!item.read && <button type="button" onClick={() => markRead(item._id)} aria-label="Mark as read"><Check size={15} /></button>}{item.link && <Link to={item.link} onClick={() => !item.read && markRead(item._id)} aria-label="Open notification"><ChevronRight size={16} /></Link>}</article>)}</div>}
      </main>
      <Footer />
    </>
  )
}
