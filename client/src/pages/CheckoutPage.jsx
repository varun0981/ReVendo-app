import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BadgeCheck, MapPin, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'
import { createOrders, getCart, verifyRazorpayPayment } from '../services/api'
import { formatPrice, getImageUrl } from '../utils/format'
import { openRazorpayCheckout } from '../utils/razorpay'

export default function CheckoutPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash on delivery (demo)')
  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    addressLine: '',
    city: user?.location?.split(',')[0] || '',
    state: '',
    postalCode: '',
  })

  useEffect(() => {
    let active = true
    getCart()
      .then((result) => { if (active) setProducts(result) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load your bag.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const total = products.reduce((sum, product) => sum + product.price, 0)

  function updateAddress(event) {
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function placeOrder(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const result = await createOrders({
        productIds: products.map((product) => product._id),
        shippingAddress: address,
        paymentMethod,
      })
      if (paymentMethod === 'Razorpay test mode') {
        if (!result.payment) throw new Error('The payment order could not be initialized. Your items remain available in your bag.')
        const orderId = result.payment.internalOrderId
        try {
          await openRazorpayCheckout(result.payment, {
            email: user?.email,
            phone: address.phone,
            onSuccess: async (paymentResponse) => {
              try {
                await verifyRazorpayPayment(paymentResponse)
                toast.success('Payment verified. Your order is confirmed.')
                navigate(`/payment/success?orderId=${orderId}`)
              } catch (verificationError) {
                navigate(`/payment/failure?orderId=${orderId}`, {
                  state: { message: verificationError.response?.data?.message || 'We could not confirm the payment yet. You can retry from this page.' },
                })
              }
            },
            onFailure: (failure) => navigate(`/payment/failure?orderId=${orderId}`, {
              state: { message: typeof failure === 'string' ? failure : 'Payment verification did not complete. Your order has not been marked paid.' },
            }),
            onDismiss: () => navigate(`/payment/failure?orderId=${orderId}`),
          })
        } catch (checkoutError) {
          navigate(`/payment/failure?orderId=${orderId}`, { state: { message: checkoutError.message || 'Razorpay checkout could not be opened.' } })
        }
      } else {
        toast.success('Your order is on its way.')
        navigate('/orders', { state: { placedOrderCount: result.data.length } })
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Your order could not be placed.')
      try { setProducts(await getCart()) } catch { /* The checkout error is already shown. */ }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="commerce-page page-gutter">
        <Link className="back-link" to="/cart"><ArrowLeft size={16} /> Back to your bag</Link>
        <div className="commerce-heading"><div><span className="eyebrow">ONE LAST LITTLE DETAIL</span><h1>Make it yours.</h1><p>Confirm where to send your good find.</p></div></div>
        {loading && <div className="commerce-message">Getting your checkout ready…</div>}
        {!loading && products.length === 0 && <div className="commerce-empty"><h2>Your bag is waiting for a find.</h2><Link className="commerce-primary" to="/browse">Explore the marketplace <ArrowRight size={15} /></Link></div>}
        {!loading && products.length > 0 && (
          <div className="checkout-layout">
            <form className="checkout-form" onSubmit={placeOrder}>
              <section className="checkout-section"><div className="checkout-section-heading"><span>01</span><div><h2>Where it’s going</h2><p>Your details are shared only with the seller fulfilling this order.</p></div></div>
                <div className="checkout-fields">
                  <label>Recipient name<input name="name" autoComplete="name" required minLength={2} maxLength={80} value={address.name} onChange={updateAddress} /></label>
                  <label>Mobile number<input name="phone" type="tel" autoComplete="tel" required pattern="\+[1-9][0-9]{7,14}" value={address.phone} onChange={updateAddress} placeholder="+91 98765 43210" /></label>
                  <label className="checkout-field-wide">Street address<input name="addressLine" autoComplete="street-address" required minLength={5} maxLength={200} value={address.addressLine} onChange={updateAddress} placeholder="House number, street, and area" /></label>
                  <label>City<input name="city" autoComplete="address-level2" required minLength={2} maxLength={80} value={address.city} onChange={updateAddress} /></label>
                  <label>State<input name="state" autoComplete="address-level1" required minLength={2} maxLength={80} value={address.state} onChange={updateAddress} /></label>
                  <label>Postal code<input name="postalCode" autoComplete="postal-code" required minLength={4} maxLength={12} value={address.postalCode} onChange={updateAddress} /></label>
                </div>
              </section>
              <section className="checkout-section"><div className="checkout-section-heading"><span>02</span><div><h2>How you’ll pay</h2><p>Choose cash on delivery or Razorpay’s test checkout.</p></div></div>
                <div className="payment-options">
                  <label className={`payment-option${paymentMethod === 'Cash on delivery (demo)' ? ' payment-option-selected' : ''}`}>
                    <input className="payment-radio" type="radio" name="paymentMethod" value="Cash on delivery (demo)" checked={paymentMethod === 'Cash on delivery (demo)'} onChange={() => setPaymentMethod('Cash on delivery (demo)')} />
                    <div><b>Cash on delivery <span>DEMO</span></b><small>Pay the seller when your find arrives. ReVendo does not process this payment.</small></div><BadgeCheck size={18} />
                  </label>
                  <label className={`payment-option${paymentMethod === 'Razorpay test mode' ? ' payment-option-selected' : ''}`}>
                    <input className="payment-radio" type="radio" name="paymentMethod" value="Razorpay test mode" checked={paymentMethod === 'Razorpay test mode'} onChange={() => setPaymentMethod('Razorpay test mode')} />
                    <div><b>Razorpay test mode <span>TEST ONLY</span></b><small>Use Razorpay’s simulated payment checkout. No real money is charged.</small></div><ShieldCheck size={18} />
                  </label>
                </div>
              </section>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="commerce-primary checkout-submit" type="submit" disabled={submitting}>{submitting ? paymentMethod === 'Razorpay test mode' ? 'Preparing secure checkout…' : 'Placing your order…' : `${paymentMethod === 'Razorpay test mode' ? 'Continue to payment' : 'Place order'} · ${formatPrice(total)}`} <ArrowRight size={16} /></button>
              <p className="checkout-terms">By placing your order, you agree to our <Link to="/terms">Terms</Link>. Orders are fulfilled directly by the seller.</p>
            </form>
            <aside className="checkout-summary"><span className="eyebrow">YOUR GOOD FINDS</span><h2>Order summary</h2><div className="checkout-products">{products.map((product) => <div className="checkout-product" key={product._id}><img src={getImageUrl(product.images?.[0])} alt="" /><span>{product.title}</span><b>{formatPrice(product.price)}</b></div>)}</div><div className="summary-line"><span>Items ({products.length})</span><b>{formatPrice(total)}</b></div><div className="summary-line"><span>Shipping</span><span>Arranged with seller</span></div><div className="summary-total"><span>{paymentMethod === 'Razorpay test mode' ? 'Total' : 'Total due on delivery'}</span><b>{formatPrice(total)}</b></div><div className="checkout-safe"><MapPin size={16} /> Your contact details stay private outside this order.</div></aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
