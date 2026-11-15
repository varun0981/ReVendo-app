import mongoose from 'mongoose'
import User from '../models/User.js'
import Product from '../models/Product.js'
import Review from '../models/Review.js'
import { imageUrl, removeUploadedImages } from '../utils/uploads.js'

function publicProfile(user, counts) {
  return {
    id: user._id,
    name: user.name,
    profileImage: user.profileImage,
    bio: user.bio,
    location: user.location,
    createdAt: user.createdAt,
    totalListings: counts.totalListings,
    totalSold: counts.totalSold,
    sellerRating: null,
  }
}

export async function getMyProfile(req, res) {
  return res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        emailVerified: req.user.emailVerified,
        phoneVerified: req.user.phoneVerified,
        profileImage: req.user.profileImage,
        bio: req.user.bio,
        location: req.user.location,
        role: req.user.role,
        accountStatus: req.user.accountStatus,
        createdAt: req.user.createdAt,
      },
    },
  })
}

export async function getPublicProfile(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid seller ID.' })
    }
    const user = await User.findById(req.params.id).select('name profileImage bio location createdAt')
    if (!user) return res.status(404).json({ success: false, message: 'Seller not found.' })

    const [totalListings, totalSold, rating] = await Promise.all([
      Product.countDocuments({ seller: user._id, status: 'Active' }),
      Product.countDocuments({ seller: user._id, status: 'Sold' }),
      Review.aggregate([{ $match: { seller: user._id } }, { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }]),
    ])
    return res.json({ success: true, data: { ...publicProfile(user, { totalListings, totalSold }), sellerRating: rating[0] ?? null } })
  } catch (error) {
    return next(error)
  }
}

export async function getUserListings(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid seller ID.' })
    }
    const userExists = await User.exists({ _id: req.params.id })
    if (!userExists) return res.status(404).json({ success: false, message: 'Seller not found.' })

    const requestedStatus = req.sanitizedQuery.status
    const status = ['Active', 'Sold'].includes(requestedStatus) ? requestedStatus : 'Active'
    const page = Math.max(Number.parseInt(req.sanitizedQuery.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(req.sanitizedQuery.limit, 10) || 12, 1), 40)
    const filter = { seller: req.params.id, status }
    const [products, total] = await Promise.all([
      Product.find(filter).select('-seller').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ])
    return res.json({
      success: true,
      data: products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return next(error)
  }
}

export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ success: false, message: 'Account not found.' })
    const oldImage = user.profileImage
    user.name = req.body.name
    user.location = req.body.location || ''
    user.bio = req.body.bio || ''
    if (req.file) user.profileImage = imageUrl(req.file)
    await user.save()
    if (req.file && oldImage) await removeUploadedImages([oldImage])
    return res.json({ success: true, data: { user: { id: user._id, name: user.name, email: user.email, phone: user.phone, profileImage: user.profileImage, bio: user.bio, location: user.location, role: user.role, createdAt: user.createdAt } } })
  } catch (error) {
    if (req.file) await removeUploadedImages([imageUrl(req.file)]).catch((cleanupError) => console.error(cleanupError))
    return next(error)
  }
}

export async function changePassword(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('+password')
    if (!user || !(await user.comparePassword(req.body.currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' })
    }
    user.password = req.body.newPassword
    await user.save()
    return res.json({ success: true, message: 'Password changed successfully.' })
  } catch (error) {
    return next(error)
  }
}
