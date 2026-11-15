import mongoose from 'mongoose'
import Cart from '../models/Cart.js'
import Product from '../models/Product.js'

async function loadCart(userId) {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'products',
    match: { status: 'Active' },
    select: '-seller',
  })
  const availableProducts = cart?.products ?? []
  if (cart && availableProducts.length !== cart.products.length) {
    cart.products = availableProducts.map((product) => product._id)
    await cart.save()
  }
  return availableProducts
}

export async function getCart(req, res, next) {
  try {
    const products = await loadCart(req.user._id)
    return res.json({ success: true, data: products })
  } catch (error) {
    return next(error)
  }
}

export async function addCartItem(req, res, next) {
  try {
    const productId = req.params.productId
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' })
    }
    const product = await Product.findOne({ _id: productId, status: 'Active' }).select('_id seller')
    if (!product) return res.status(404).json({ success: false, message: 'This find is no longer available.' })
    if (product.seller?.equals(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot buy your own listing.' })
    }
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { products: product._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
    return res.json({ success: true, message: 'Added to your bag.' })
  } catch (error) {
    return next(error)
  }
}

export async function removeCartItem(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' })
    }
    await Cart.findOneAndUpdate({ user: req.user._id }, { $pull: { products: req.params.productId } })
    return res.json({ success: true, message: 'Removed from your bag.' })
  } catch (error) {
    return next(error)
  }
}
