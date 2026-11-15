const checkoutScriptUrl = 'https://checkout.razorpay.com/v1/checkout.js'
let checkoutScript

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve()
  if (checkoutScript) return checkoutScript

  checkoutScript = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = checkoutScriptUrl
    script.async = true
    script.onload = () => window.Razorpay ? resolve() : reject(new Error('Razorpay checkout did not initialize.'))
    script.onerror = () => reject(new Error('Razorpay checkout could not be loaded. Check your internet connection.'))
    document.body.appendChild(script)
  }).catch((error) => {
    checkoutScript = undefined
    throw error
  })

  return checkoutScript
}

export async function openRazorpayCheckout(payment, { email, phone, onSuccess, onFailure, onDismiss }) {
  await loadRazorpayCheckout()
  let completed = false
  const checkout = new window.Razorpay({
    key: payment.keyId,
    amount: payment.amount,
    currency: payment.currency,
    name: 'ReVendo',
    description: 'Give good things a second life.',
    order_id: payment.orderId,
    prefill: { email, contact: phone },
    theme: { color: '#e8794c' },
    handler: (response) => {
      completed = true
      Promise.resolve(onSuccess(response)).catch(onFailure)
    },
    modal: {
      ondismiss: () => {
        if (!completed) onDismiss()
      },
    },
  })
  checkout.on('payment.failed', (response) => {
    completed = true
    onFailure(response.error?.description)
  })
  checkout.open()
}
