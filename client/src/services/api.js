import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true,
})

export async function getProducts(params = {}) {
  const { data } = await api.get('/products', { params })
  return data
}

export async function getProduct(id) {
  const { data } = await api.get(`/products/${id}`)
  return data.data
}

export async function contactSeller(id) {
  const { data } = await api.post(`/products/${id}/contact`)
  return data
}

export async function reportProduct(id, payload) {
  const { data } = await api.post(`/reports/${id}`, payload)
  return data
}

export async function getMyProducts(params = {}) {
  const { data } = await api.get('/products/mine', { params })
  return data
}

export async function getMyProduct(id) {
  const { data } = await api.get(`/products/mine/${id}`)
  return data.data
}

export async function createProduct(formData) {
  const { data } = await api.post('/products', formData)
  return data
}

export async function updateProduct(id, formData) {
  const { data } = await api.put(`/products/${id}`, formData)
  return data
}

export async function deleteProduct(id) {
  const { data } = await api.delete(`/products/${id}`)
  return data
}

export async function updateProductStatus(id, status) {
  const { data } = await api.patch(`/products/${id}/status`, { status })
  return data
}

export async function getMyProfile() {
  const { data } = await api.get('/users/profile')
  return data.data.user
}

export async function getPublicProfile(id) {
  const { data } = await api.get(`/users/${id}`)
  return data.data
}

export async function getUserListings(id, params = {}) {
  const { data } = await api.get(`/users/${id}/listings`, { params })
  return data
}

export async function updateMyProfile(formData) {
  const { data } = await api.put('/users/profile', formData)
  return data.data.user
}

export async function changeMyPassword(payload) {
  const { data } = await api.put('/users/password', payload)
  return data
}

export async function getCart() {
  const { data } = await api.get('/cart')
  return data.data
}

export async function addCartItem(productId) {
  const { data } = await api.post(`/cart/${productId}`)
  return data
}

export async function removeCartItem(productId) {
  const { data } = await api.delete(`/cart/${productId}`)
  return data
}

export async function getWishlist() {
  const { data } = await api.get('/wishlist')
  return data.data
}

export async function addWishlistItem(productId) {
  const { data } = await api.post(`/wishlist/${productId}`)
  return data
}

export async function removeWishlistItem(productId) {
  const { data } = await api.delete(`/wishlist/${productId}`)
  return data
}

export async function createOrders(payload) {
  const { data } = await api.post('/orders', payload)
  return data
}

export async function getPendingPayment(orderId) {
  const { data } = await api.get(`/orders/${orderId}/payment`)
  return data.data
}

export async function verifyRazorpayPayment(payload) {
  const { data } = await api.post('/orders/payment/verify', payload)
  return data
}

export async function getMyOrders() {
  const { data } = await api.get('/orders/my-orders')
  return data.data
}

export async function getOrder(id) {
  const { data } = await api.get(`/orders/${id}`)
  return data.data
}

export async function updateOrder(id, status) {
  const { data } = await api.patch(`/orders/${id}/status`, { status })
  return data
}

export async function reviewOrder(id, payload) {
  const { data } = await api.post(`/orders/${id}/review`, payload)
  return data
}

export async function getNotifications() {
  const { data } = await api.get('/notifications')
  return data
}

export async function markNotificationRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`)
  return data.data
}

export async function registerAccount(payload) {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function loginAccount(payload) {
  const { data } = await api.post('/auth/login', payload)
  return data.data.user
}

export async function logoutAccount() {
  await api.post('/auth/logout')
}

export async function getCurrentUser() {
  const { data } = await api.get('/auth/me')
  return data.data.user
}

export async function verifyEmail(payload) {
  const { data } = await api.post('/auth/verify-email', payload)
  return data
}

export async function sendOtp(payload) {
  const { data } = await api.post('/auth/send-otp', payload)
  return data
}

export async function verifyOtp(payload) {
  const { data } = await api.post('/auth/verify-otp', payload)
  return data
}

export async function requestPasswordReset(payload) {
  const { data } = await api.post('/auth/forgot-password', payload)
  return data
}

export async function resetPassword(payload) {
  const { data } = await api.post('/auth/reset-password', payload)
  return data
}

export default api
