import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, BadgeCheck, MapPin, PackageCheck, ShieldCheck, Truck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'
import { getOrder, reviewOrder, updateOrder } from '../services/api'
import { formatPrice, getImageUrl } from '../utils/format'

export default function OrderDetailsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const loadOrder = useCallback(async () => {
    try {
      setOrder(await getOrder(id))
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load this order.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    let active = true
    getOrder(id)
      .then((result) => {
        if (active) {
          setOrder(result)
          setError('')
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load this order.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  async function changeStatus(status) {
    setBusy(true)
    try {
      await updateOrder(id, status)
      await loadOrder()
      toast.success(`Order ${status.toLowerCase()}.`)
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not update this order.')
    } finally {
      setBusy(false)
    }
  }

  async function sendReview(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await reviewOrder(id, { rating, comment })
      toast.success('Thanks for sharing your experience.')
      setOrder((current) => ({ ...current, reviewSubmitted: true }))
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not submit your review.')
    } finally {
      setBusy(false)
    }
  }

  const isSeller = order?.seller?._id === user?.id
  const paymentAwaiting = order?.paymentMethod === 'Razorpay test mode' && order?.paymentStatus !== 'Paid'
  const nextSellerStatus = paymentAwaiting ? null : { Pending: 'Confirmed', Confirmed: 'Shipped', Shipped: 'Delivered' }[order?.orderStatus]
  const canCancel = !isSeller && !paymentAwaiting && ['Pending', 'Confirmed'].includes(order?.orderStatus)

  return (
    <>
      <Navbar />
      <main className="commerce-page page-gutter order-detail-page">
        <Link className="back-link" to="/orders"><ArrowLeft size={16} /> Back to orders</Link>
        {loading && <div className="commerce-message">Loading your order…</div>}
        {error && !loading && <div className="inline-error">{error}<Link to="/orders">View all orders</Link></div>}
        {order && (
          <>
            <div className="order-detail-head"><div><span className="eyebrow">ORDER · {order._id.slice(-8).toUpperCase()}</span><h1>Good things, on their way.</h1><p>Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div><span className={`status-chip status-${order.orderStatus.toLowerCase()}`}>{order.orderStatus}</span></div>
            <div className="order-detail-layout">
              <section className="order-detail-main">
                <div className="order-progress">{['Pending', 'Confirmed', 'Shipped', 'Delivered'].map((step, index) => {
                  const statuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered']
                  const currentIndex = statuses.indexOf(order.orderStatus)
                  const completed = index <= currentIndex
                  return <div className={`order-progress-step${completed ? ' complete' : ''}`} key={step}><span>{index < 2 ? <BadgeCheck size={15} /> : index === 2 ? <Truck size={15} /> : <PackageCheck size={15} />}</span><b>{step}</b></div>
                })}</div>
                <div className="order-detail-products">{order.products.map((item) => <div className="order-detail-product" key={item.product}><img src={getImageUrl(item.image)} alt="" /><div><b>{item.title}</b><span>One of a kind · Quantity 1</span></div><strong>{formatPrice(item.price)}</strong></div>)}</div>
                <div className="order-address"><div className="order-block-heading"><MapPin size={16} /><b>Delivery address</b></div><p><b>{order.shippingAddress.name}</b><br />{order.shippingAddress.addressLine}<br />{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />{order.shippingAddress.phone}</p></div>
                <div className="order-payment-note"><ShieldCheck size={16} /><span><b>{order.paymentMethod === 'Razorpay test mode' ? 'Razorpay test mode · ' + order.paymentStatus : 'Cash on delivery (demo)'}</b><br />{order.paymentMethod === 'Razorpay test mode' ? order.paymentStatus === 'Paid' ? 'Your payment was verified in test mode. No real money was charged.' : 'Payment has not been confirmed. Complete payment before the seller processes this order.' : 'No online payment was processed. Pay the seller when your find arrives.'}</span></div>
              </section>
              <aside className="order-side-panel"><span className="eyebrow">{isSeller ? 'SELLER VIEW' : 'YOUR ORDER'}</span><h2>{isSeller ? 'A good thing found a new home.' : 'A lovely choice.'}</h2><div className="summary-line"><span>Items ({order.products.length})</span><b>{formatPrice(order.totalAmount)}</b></div><div className="summary-line"><span>Payment</span><span>{order.paymentMethod === 'Razorpay test mode' ? order.paymentStatus === 'Paid' ? 'Paid · test mode' : 'Awaiting payment' : 'On delivery'}</span></div><div className="summary-total"><span>Total</span><b>{formatPrice(order.totalAmount)}</b></div>
                {isSeller && nextSellerStatus && <button className="commerce-primary" type="button" disabled={busy} onClick={() => changeStatus(nextSellerStatus)}>{busy ? 'Updating…' : `${nextSellerStatus} order`} <Truck size={15} /></button>}
                {!isSeller && paymentAwaiting && <Link className="commerce-primary" to={`/payment/failure?orderId=${order._id}`}>Continue to payment <ShieldCheck size={15} /></Link>}
                {canCancel && <button className="cancel-order-button" type="button" disabled={busy} onClick={() => { if (window.confirm('Cancel this order? The find will return to the marketplace.')) changeStatus('Cancelled') }}>Cancel order</button>}
                {!isSeller && order.orderStatus === 'Delivered' && !order.reviewSubmitted && <form className="review-form" onSubmit={sendReview}><b>How was your experience?</b><label>Rating<select value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} {value === 1 ? 'star' : 'stars'}</option>)}</select></label><textarea rows={3} maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share a kind, honest note (optional)" /><button className="commerce-primary" type="submit" disabled={busy}>Leave a review <BadgeCheck size={15} /></button></form>}
                {order.reviewSubmitted && <p className="auth-success">Thank you for reviewing this seller.</p>}
              </aside>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
