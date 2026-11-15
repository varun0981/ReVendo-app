import mongoose from 'mongoose'
import Notification from '../models/Notification.js'
import Product from '../models/Product.js'
import Report from '../models/Report.js'

export async function reportProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' })
    }
    const product = await Product.findOne({ _id: req.params.id, status: 'Active' }).select('title seller')
    if (!product) return res.status(404).json({ success: false, message: 'This listing is not available to report.' })
    if (product.seller?.equals(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot report your own listing.' })
    }
    const report = await Report.create({
      reporter: req.user._id,
      product: product._id,
      reason: req.body.reason,
      description: req.body.description || '',
    })
    await Notification.create({
      user: product.seller,
      title: 'Your listing has been reported',
      message: `A concern was reported about “${product.title}”. ReVendo will review the listing.`,
      type: 'listing',
      link: `/products/${product._id}`,
    })
    return res.status(201).json({ success: true, data: { id: report._id }, message: 'Thanks for helping keep ReVendo thoughtful. Our team will review this listing.' })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'You have already reported this listing.' })
    return next(error)
  }
}
