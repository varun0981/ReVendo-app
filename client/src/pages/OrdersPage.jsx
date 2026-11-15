import { useEffect, useState } from 'react'
import { ArrowRight, PackageCheck, ShoppingBag } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'
import { getMyOrders } from '../services/api'
import { formatPrice, formatPostedTime, getImageUrl } from '../utils/format'

export default function OrdersPage() {
  const { user } = useAuth()
  const location = useLocation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getMyOrders()
      .then((result) => { if (active) setOrders(result) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load your orders.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <>
      <Navbar />
      <main className="commerce-page page-gutter">
        <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><b>Orders</b></div>
        {location.state?.placedOrderCount && <div className="order-success-banner"><PackageCheck size={19} /><span>Your order{location.state.placedOrderCount > 1 ? 's are' : ' is'} placed. The seller will be in touch to arrange delivery.</span></div>}
        <div className="commerce-heading"><div><span className="eyebrow">A LITTLE HISTORY OF GOOD THINGS</span><h1>My orders.</h1><p>Your good finds, on their way or already passed along.</p></div></div>
        {loading && <div className="commerce-message">Gathering your orders…</div>}
        {error && !loading && <div className="inline-error">{error}</div>}
        {!loading && !error && orders.length === 0 && <div className="commerce-empty"><span className="commerce-empty-mark"><ShoppingBag size={24} /></span><h2>No orders, just possibilities.</h2><p>Your next favorite thing might be waiting nearby.</p><Link className="commerce-primary" to="/browse">Find your next good thing <ArrowRight size={15} /></Link></div>}
        {!loading && orders.length > 0 && <div className="order-list">{orders.map((order) => {
          const isSeller = order.seller?._id === user?.id
          return <Link className="order-card" to={`/orders/${order._id}`} key={order._id}>
            <div className="order-card-head"><span>ORDER · {order._id.slice(-8).toUpperCase()}</span><span className={`status-chip status-${order.orderStatus.toLowerCase()}`}>{order.orderStatus}</span></div>
            <div className="order-card-body"><div className="order-thumbnails">{order.products.slice(0, 3).map((item) => <img src={getImageUrl(item.image)} alt="" key={item.product} />)}</div><div className="order-card-copy"><b>{order.products.length} {order.products.length === 1 ? 'find' : 'finds'} · {isSeller ? `Buyer ${order.buyer?.name || ''}` : `From ${order.seller?.name || 'seller'}`}</b><span>{formatPostedTime(order.createdAt)} · {order.paymentMethod === 'Razorpay test mode' ? 'Razorpay test mode' : 'Cash on delivery (demo)'} · {order.paymentStatus === 'Paid' ? 'Paid' : 'Payment pending'}</span></div><div className="order-card-total"><b>{formatPrice(order.totalAmount)}</b><ArrowRight size={16} /></div></div>
          </Link>
        })}</div>}
      </main>
      <Footer />
    </>
  )
}
