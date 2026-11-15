import mongoose from 'mongoose'
import Product from '../models/Product.js'
import Wishlist from '../models/Wishlist.js'

export async function getWishlist(req, res, next) {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products',
      match: { status: 'Active' },
      select: '-seller',
    })
    return res.json({ success: true, data: wishlist?.products ?? [] })
  } catch (error) {
    return next(error)
  }
}

export async function addWishlistItem(req, res, next) {
  try {
    const productId = req.params.productId
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' })
    }
    const product = await Product.findOne({ _id: productId, status: 'Active' }).select('_id seller')
    if (!product) return res.status(404).json({ success: false, message: 'This find is no longer available.' })
    if (product.seller?.equals(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot save your own listing.' })
    }
    await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { products: product._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
    return res.json({ success: true, message: 'Saved to your wishlist.' })
  } catch (error) {
    return next(error)
  }
}

export async function removeWishlistItem(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' })
    }
    await Wishlist.findOneAndUpdate({ user: req.user._id }, { $pull: { products: req.params.productId } })
    return res.json({ success: true, message: 'Removed from your wishlist.' })
  } catch (error) {
    return next(error)
  }
}
