import { useEffect, useState } from 'react'
import { ArrowRight, PackageCheck } from 'lucide-react'
import { getAdminOrders, updateAdminOrder } from '../../services/adminApi'
import { formatPrice, getImageUrl } from '../../utils/format'

const filters = ['', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']
const transitions = { Pending: 'Confirmed', Confirmed: 'Shipped', Shipped: 'Delivered' }

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    let active = true
    getAdminOrders({ status, limit: 100 })
      .then((result) => { if (active) setOrders(result.data) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load orders.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [status])

  async function advance(order, nextStatus) {
    setBusyId(order._id)
    try {
      await updateAdminOrder(order._id, nextStatus)
      setOrders((current) => current.map((item) => item._id === order._id ? { ...item, orderStatus: nextStatus } : item))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update this order.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <section className="admin-section-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">KEEPING GOOD THINGS MOVING</span><h1>Order management.</h1><p>Track marketplace orders and help resolve delivery issues.</p></div></div>
      <div className="admin-list-toolbar"><div className="admin-toolbar-intro"><PackageCheck size={17} /> Marketplace orders</div><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter orders">{filters.map((value) => <option value={value} key={value}>{value || 'All statuses'}</option>)}</select><span>{orders.length} orders</span></div>
      {error && <div className="admin-error">{error}</div>}
      {loading ? <div className="admin-loading">Gathering order details…</div> : <div className="admin-order-list">{orders.map((order) => {
        const next = order.paymentMethod === 'Razorpay test mode' && order.paymentStatus !== 'Paid' ? null : transitions[order.orderStatus]
        return <article className="admin-order-card" key={order._id}><div className="admin-order-head"><div><span>ORDER · {order._id.slice(-8).toUpperCase()}</span><small>{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</small></div><span className={`status-chip status-${order.orderStatus.toLowerCase()}`}>{order.orderStatus}</span></div><div className="admin-order-body"><div className="admin-order-thumb">{order.products[0]?.image && <img src={getImageUrl(order.products[0].image)} alt="" />}</div><div className="admin-order-parties"><b>{order.products.length} {order.products.length === 1 ? 'find' : 'finds'}</b><span>Buyer: {order.buyer?.name || 'Unknown'} · {order.buyer?.email || ''}</span><span>Seller: {order.seller?.name || 'Unknown'} · {order.seller?.email || ''}</span></div><div className="admin-order-amount"><b>{formatPrice(order.totalAmount)}</b><small>{order.paymentMethod === 'Razorpay test mode' ? `Razorpay test · ${order.paymentStatus}` : `COD · ${order.paymentStatus}`}</small></div>{next && <button className="admin-order-advance" type="button" disabled={busyId === order._id} onClick={() => advance(order, next)}>Mark {next.toLowerCase()} <ArrowRight size={14} /></button>}</div></article>
      })}{orders.length === 0 && !error && <div className="admin-empty-small">No orders match this filter.</div>}</div>}
    </section>
  )
}
