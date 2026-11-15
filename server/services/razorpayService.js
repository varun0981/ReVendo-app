import { createHmac, timingSafeEqual } from 'node:crypto'

const razorpayOrdersUrl = 'https://api.razorpay.com/v1/orders'

function paymentError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim()
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw paymentError(503, 'Razorpay test mode is not configured. Add the test key ID and secret to server/.env.')
  }
  if (!/^rzp_test_[A-Za-z0-9]+$/.test(keyId)) {
    throw paymentError(503, 'Only Razorpay test-mode credentials are accepted.')
  }

  return { keyId, keySecret }
}

export function getRazorpayKeyId() {
  return credentials().keyId
}

export async function createRazorpayOrder({ amount, receipt, notes }) {
  const { keyId, keySecret } = credentials()
  if (!Number.isSafeInteger(amount) || amount < 100) {
    throw paymentError(400, 'The payment amount must be at least ₹1.00.')
  }

  let response
  try {
    response = await fetch(razorpayOrdersUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, currency: 'INR', receipt, notes }),
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    throw paymentError(502, 'Razorpay could not be reached. Please try again.')
  }

  const result = await response.json().catch(() => null)
  if (!response.ok || result?.currency !== 'INR' || result?.amount !== amount || typeof result?.id !== 'string') {
    throw paymentError(502, 'Razorpay could not create a test payment order. Please try again.')
  }

  return { id: result.id, amount: result.amount, currency: result.currency, keyId }
}

export function verifyRazorpaySignature(orderId, paymentId, signature) {
  const { keySecret } = credentials()
  const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest()
  const actual = Buffer.from(signature, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
