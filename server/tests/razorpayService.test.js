import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { afterEach, test } from 'node:test'
import {
  createRazorpayOrder, getRazorpayKeyId, verifyRazorpaySignature,
} from '../services/razorpayService.js'

const originalKeyId = process.env.RAZORPAY_KEY_ID
const originalKeySecret = process.env.RAZORPAY_KEY_SECRET
const originalFetch = globalThis.fetch

afterEach(() => {
  if (originalKeyId === undefined) delete process.env.RAZORPAY_KEY_ID
  else process.env.RAZORPAY_KEY_ID = originalKeyId
  if (originalKeySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET
  else process.env.RAZORPAY_KEY_SECRET = originalKeySecret
  globalThis.fetch = originalFetch
})

test('only test-mode credentials are accepted', () => {
  delete process.env.RAZORPAY_KEY_ID
  delete process.env.RAZORPAY_KEY_SECRET
  assert.throws(getRazorpayKeyId, /not configured/)

  process.env.RAZORPAY_KEY_ID = ['rzp', 'live', 'example'].join('_')
  process.env.RAZORPAY_KEY_SECRET = 'test-secret'
  assert.throws(getRazorpayKeyId, /test-mode credentials/)
})

test('does not contact the gateway without credentials', async () => {
  delete process.env.RAZORPAY_KEY_ID
  delete process.env.RAZORPAY_KEY_SECRET
  let gatewayCalled = false
  globalThis.fetch = async () => {
    gatewayCalled = true
    throw new Error('Gateway must not be called.')
  }

  await assert.rejects(
    createRazorpayOrder({ amount: 12500, receipt: 'test-receipt', notes: {} }),
    /not configured/,
  )
  assert.equal(gatewayCalled, false)
})

test('creates an INR gateway order with server-side basic authentication', async () => {
  process.env.RAZORPAY_KEY_ID = 'rzp_test_example'
  process.env.RAZORPAY_KEY_SECRET = 'server-only-secret'
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) }
    return new Response(JSON.stringify({ id: 'order_test123', amount: 12500, currency: 'INR' }), { status: 200 })
  }

  const result = await createRazorpayOrder({
    amount: 12500,
    receipt: 'test-receipt',
    notes: { buyerId: 'buyer-id' },
  })

  assert.equal(request.url, 'https://api.razorpay.com/v1/orders')
  assert.equal(request.options.headers.Authorization, `Basic ${Buffer.from('rzp_test_example:server-only-secret').toString('base64')}`)
  assert.deepEqual(request.body, { amount: 12500, currency: 'INR', receipt: 'test-receipt', notes: { buyerId: 'buyer-id' } })
  assert.deepEqual(result, { id: 'order_test123', amount: 12500, currency: 'INR', keyId: 'rzp_test_example' })
})

test('rejects invalid signatures and accepts only the expected HMAC', () => {
  process.env.RAZORPAY_KEY_ID = 'rzp_test_example'
  process.env.RAZORPAY_KEY_SECRET = 'server-only-secret'
  const orderId = 'order_test123'
  const paymentId = 'pay_test456'
  const signature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex')

  assert.equal(verifyRazorpaySignature(orderId, paymentId, signature), true)
  assert.equal(verifyRazorpaySignature(orderId, paymentId, '0'.repeat(64)), false)
})
