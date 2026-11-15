import api from './api'

export async function getAdminDashboard() {
  const { data } = await api.get('/admin/dashboard')
  return data.data
}

export async function getAdminUsers(params = {}) {
  const { data } = await api.get('/admin/users', { params })
  return data
}

export async function updateAdminUser(id, status) {
  const { data } = await api.patch(`/admin/users/${id}/status`, { status })
  return data
}

export async function getAdminProducts(params = {}) {
  const { data } = await api.get('/admin/products', { params })
  return data
}

export async function moderateAdminProduct(id, action, reason = '') {
  const { data } = await api.patch(`/admin/products/${id}/${action}`, { reason })
  return data
}

export async function deleteAdminProduct(id) {
  const { data } = await api.delete(`/admin/products/${id}`)
  return data
}

export async function getAdminOrders(params = {}) {
  const { data } = await api.get('/admin/orders', { params })
  return data
}

export async function updateAdminOrder(id, status) {
  const { data } = await api.patch(`/orders/${id}/status`, { status })
  return data
}

export async function getAdminReports(params = {}) {
  const { data } = await api.get('/admin/reports', { params })
  return data
}

export async function updateAdminReport(id, status, resolutionNote = '') {
  const { data } = await api.patch(`/admin/reports/${id}`, { status, resolutionNote })
  return data
}

