import mongoose from 'mongoose'
import User from '../models/User.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import Notification from '../models/Notification.js'
import Report from '../models/Report.js'
import { removeUploadedImages } from '../utils/uploads.js'

const safePattern = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export async function dashboard(req, res, next) {
  try {
    const start = new Date()
    start.setDate(start.getDate() - 13)
    start.setHours(0, 0, 0, 0)
    const [totalUsers, totalProducts, activeListings, soldProducts, totalOrders, pendingReports, recentUsers, recentListings, usersByDay, listingsByDay, ordersByDay] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Product.countDocuments({ status: 'Active' }),
      Product.countDocuments({ status: 'Sold' }),
      Order.countDocuments(),
      Report.countDocuments({ status: { $in: ['New', 'In review'] } }),
      User.find().select('name email profileImage role createdAt').sort({ createdAt: -1 }).limit(5).lean(),
      Product.find().select('title price status images createdAt seller').populate('seller', 'name').sort({ createdAt: -1 }).limit(5).lean(),
      User.aggregate([{ $match: { createdAt: { $gte: start } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Product.aggregate([{ $match: { createdAt: { $gte: start } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Order.aggregate([{ $match: { createdAt: { $gte: start } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    ])
    return res.json({
      success: true,
      data: {
        stats: { totalUsers, totalProducts, activeListings, soldProducts, totalOrders, pendingReports },
        recentUsers,
        recentListings,
        charts: { usersByDay, listingsByDay, ordersByDay },
      },
    })
  } catch (error) {
    return next(error)
  }
}

export async function listAdminUsers(req, res, next) {
  try {
    const query = req.sanitizedQuery
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100)
    const filter = {}
    if (typeof query.search === 'string' && query.search.trim()) {
      const search = safePattern(query.search.trim().slice(0, 80))
      filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }]
    }
    if (['User', 'Admin'].includes(query.role)) filter.role = query.role
    if (['Active', 'Suspended'].includes(query.status)) filter.accountStatus = query.status
    const [users, total] = await Promise.all([
      User.find(filter).select('name email phone profileImage role accountStatus emailVerified phoneVerified createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ])
    return res.json({ success: true, data: users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    return next(error)
  }
}

export async function setUserStatus(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid user ID.' })
    if (!['Active', 'Suspended'].includes(req.body.status)) return res.status(400).json({ success: false, message: 'Choose a valid account status.' })
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ success: false, message: 'You cannot change your own account status.' })
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'User' },
      { accountStatus: req.body.status },
      { new: true, runValidators: true },
    ).select('name email accountStatus')
    if (!user) return res.status(404).json({ success: false, message: 'User not found or cannot be managed.' })
    return res.json({ success: true, data: user })
  } catch (error) {
    return next(error)
  }
}

export async function listAdminProducts(req, res, next) {
  try {
    const query = req.sanitizedQuery
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100)
    const filter = {}
    if (['Active', 'Sold', 'Pending', 'Rejected'].includes(query.status)) filter.status = query.status
    if (typeof query.search === 'string' && query.search.trim()) {
      const search = safePattern(query.search.trim().slice(0, 80))
      filter.$or = [{ title: new RegExp(search, 'i') }, { brand: new RegExp(search, 'i') }]
    }
    const [products, total] = await Promise.all([
      Product.find(filter).select('+moderationNote').populate('seller', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ])
    return res.json({ success: true, data: products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    return next(error)
  }
}

async function moderateProduct(req, res, next, status) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid product ID.' })
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ['Pending', 'Rejected'] } },
      { status, moderationNote: status === 'Rejected' ? req.body.reason || 'Please review your listing and try again.' : '' },
      { new: true, runValidators: true },
    )
    if (!product) return res.status(404).json({ success: false, message: 'Pending listing not found.' })
    await Notification.create({
      user: product.seller,
      title: status === 'Active' ? 'Your listing is live' : 'Your listing needs an update',
      message: status === 'Active' ? 'Your listing has been approved and is now visible in the marketplace.' : `Your listing was not approved: ${product.moderationNote}`,
      type: 'listing',
      link: `/products/${product._id}`,
    })
    return res.json({ success: true, data: product })
  } catch (error) {
    return next(error)
  }
}

export async function approveProduct(req, res, next) {
  return moderateProduct(req, res, next, 'Active')
}

export async function rejectProduct(req, res, next) {
  return moderateProduct(req, res, next, 'Rejected')
}

export async function deleteAdminProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid product ID.' })
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' })
    await removeUploadedImages(product.images)
    return res.json({ success: true, message: 'Product removed.' })
  } catch (error) {
    return next(error)
  }
}

export async function listAdminOrders(req, res, next) {
  try {
    const page = Math.max(Number.parseInt(req.sanitizedQuery.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(req.sanitizedQuery.limit, 10) || 20, 1), 100)
    const filter = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].includes(req.sanitizedQuery.status)
      ? { orderStatus: req.sanitizedQuery.status }
      : {}
    const [orders, total] = await Promise.all([
      Order.find(filter).populate('buyer', 'name email').populate('seller', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(filter),
    ])
    return res.json({ success: true, data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    return next(error)
  }
}

export async function listReports(req, res, next) {
  try {
    const status = req.sanitizedQuery.status
    const filter = ['New', 'In review', 'Resolved', 'Dismissed'].includes(status) ? { status } : {}
    const reports = await Report.find(filter).populate('reporter', 'name email').populate('product', 'title status images').sort({ createdAt: -1 }).limit(100).lean()
    return res.json({ success: true, data: reports })
  } catch (error) {
    return next(error)
  }
}

export async function updateReport(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid report ID.' })
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, resolutionNote: req.body.resolutionNote || '' },
      { new: true, runValidators: true },
    )
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' })
    return res.json({ success: true, data: report })
  } catch (error) {
    return next(error)
  }
}
