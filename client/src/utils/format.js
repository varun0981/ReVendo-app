export function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatPostedTime(date) {
  const elapsed = Date.now() - new Date(date).getTime()
  const days = Math.floor(elapsed / 86400000)
  if (days < 1) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(date))
}

export function getImageUrl(image) {
  if (!image) return ''
  if (/^https?:\/\//i.test(image)) return image
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')
  return `${baseUrl}${image.startsWith('/') ? image : `/${image}`}`
}
