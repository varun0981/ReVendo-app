import { useEffect, useState } from 'react'
import { BadgeCheck, PackageCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { getOrder } from '../services/api'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(Boolean(orderId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId) return
    let active = true
    getOrder(orderId)
      .then((result) => {
        if (!active) return
        if (result.paymentStatus !== 'Paid') setError('The payment has not been confirmed yet. Check your orders before trying again.')
        else setOrder(result)
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'We could not confirm this payment.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [orderId])

  return (
    <>
      <Navbar />
      <main className="payment-result-page page-gutter">
        <section className="payment-result-card">
          {loading ? <span className="payment-result-icon"><BadgeCheck size={27} /></span> : order ? <span className="payment-result-icon payment-result-success"><BadgeCheck size={27} /></span> : <span className="payment-result-icon"><PackageCheck size={27} /></span>}
          <span className="eyebrow">{loading ? 'VERIFYING PAYMENT' : order ? 'PAYMENT CONFIRMED' : 'PAYMENT STATUS'}</span>
          <h1>{loading ? 'One moment…' : order ? 'A lovely choice.' : 'Payment needs a check.'}</h1>
          <p>{loading ? 'Checking the verified order status with ReVendo.' : order ? 'Your Razorpay test payment was verified. No real money was charged.' : error || 'We could not find the order for this payment.'}</p>
          {!loading && order && <Link className="commerce-primary" to={`/orders/${order._id}`}>View your order <PackageCheck size={16} /></Link>}
          {!loading && !order && <Link className="commerce-primary" to="/orders">Check my orders <PackageCheck size={16} /></Link>}
          <Link className="payment-result-secondary" to="/browse">Back to the marketplace</Link>
        </section>
      </main>
      <Footer />
    </>
  )
}
