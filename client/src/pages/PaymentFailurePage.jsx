import { useEffect, useState } from 'react'
import { ArrowRight, RefreshCw, ShieldAlert } from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'
import { getOrder, getPendingPayment, verifyRazorpayPayment } from '../services/api'
import { openRazorpayCheckout } from '../utils/razorpay'

export default function PaymentFailurePage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(Boolean(orderId))
  const [retrying, setRetrying] = useState(false)
  const [message, setMessage] = useState(location.state?.message || '')

  useEffect(() => {
    if (!orderId) return
    let active = true
    getPendingPayment(orderId)
      .then((result) => { if (active) setPayment(result) })
      .catch(async (requestError) => {
        if (requestError.response?.status === 404) {
          try {
            const order = await getOrder(orderId)
            if (order.paymentStatus === 'Paid') {
              navigate(`/payment/success?orderId=${orderId}`, { replace: true })
              return
            }
          } catch {
            // Show the original payment status error below.
          }
        }
        if (active) setMessage(requestError.response?.data?.message || 'Payment was not confirmed. You can try again.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [navigate, orderId])

  async function retryPayment() {
    setRetrying(true)
    setMessage('')
    try {
      const pendingPayment = await getPendingPayment(orderId)
      await openRazorpayCheckout(pendingPayment, {
        email: user?.email,
        phone: user?.phone,
        onSuccess: async (paymentResponse) => {
          try {
            await verifyRazorpayPayment(paymentResponse)
            navigate(`/payment/success?orderId=${orderId}`)
          } catch (verificationError) {
            setMessage(verificationError.response?.data?.message || 'We could not confirm the payment yet. You can retry.')
          }
        },
        onFailure: (failure) => setMessage(typeof failure === 'string' ? failure : 'Payment was not completed. No order was marked paid.'),
        onDismiss: () => setMessage('Checkout was closed. Your order is still awaiting payment.'),
      })
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || requestError.message || 'Razorpay checkout could not be opened.')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="payment-result-page page-gutter">
        <section className="payment-result-card">
          <span className="payment-result-icon payment-result-failure"><ShieldAlert size={27} /></span>
          <span className="eyebrow">PAYMENT NOT CONFIRMED</span>
          <h1>No worries, try again.</h1>
          <p>{loading ? 'Checking whether this order can be retried…' : message || (orderId ? 'Your order has not been marked paid. You can retry with Razorpay test mode.' : 'We could not find the order for this payment.')}</p>
          {!loading && payment && <button className="commerce-primary" type="button" disabled={retrying} onClick={retryPayment}>{retrying ? 'Opening secure checkout…' : 'Retry test payment'} <RefreshCw size={15} /></button>}
          {!loading && orderId && !payment && <Link className="commerce-primary" to="/orders">Check my orders <ArrowRight size={15} /></Link>}
          <Link className="payment-result-secondary" to="/browse">Back to the marketplace</Link>
        </section>
      </main>
      <Footer />
    </>
  )
}
