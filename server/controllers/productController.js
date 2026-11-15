import mongoose from 'mongoose'
import Notification from '../models/Notification.js'
import Product from '../models/Product.js'
import { imageUrl, removeUploadedImages } from '../utils/uploads.js'

const categories = [
  'Electronics', 'Mobiles', 'Laptops', 'Fashion', 'Furniture', 'Home Appliances',
  'Books', 'Sports', 'Vehicles', 'Gaming', 'Accessories', 'Other',
]
const conditions = ['Like New', 'Excellent', 'Good', 'Fair']

function productValues(body, files) {
  return {
    title: body.title,
    description: body.description,
    category: body.category,
    brand: body.brand || '',
    price: Number(body.price),
    originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
    condition: body.condition,
    location: body.location,
    negotiable: body.negotiable === 'true',
    contactPreferences: Array.isArray(body.contactPreferences)
      ? body.contactPreferences.filter((preference) => ['chat', 'phone', 'email'].includes(preference))
      : body.contactPreferences ? [body.contactPreferences].filter((preference) => ['chat', 'phone', 'email'].includes(preference)) : ['chat'],
    images: files?.length ? files.map(imageUrl) : undefined,
  }
}

export async function listProducts(req, res, next) {
  try {
    const query = req.sanitizedQuery
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 12, 1), 40)
    const filter = { status: 'Active' }
    const search = typeof query.search === 'string' ? query.search.trim().slice(0, 100) : ''

    if (search) filter.$text = { $search: search }
    if (typeof query.category === 'string' && categories.includes(query.category)) filter.category = query.category
    if (typeof query.location === 'string' && query.location.trim()) {
      const location = query.location.trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.location = new RegExp(location, 'i')
    }
    if (typeof query.condition === 'string' && conditions.includes(query.condition)) filter.condition = query.condition

    const minPrice = Number(query.minPrice)
    const maxPrice = Number(query.maxPrice)
    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
      filter.price = {}
      if (Number.isFinite(minPrice)) filter.price.$gte = minPrice
      if (Number.isFinite(maxPrice)) filter.price.$lte = maxPrice
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
    }
    const sort = sortOptions[query.sort] ?? sortOptions.newest
    const [products, total] = await Promise.all([
      Product.find(filter).select('-seller').sort(sort).skip((page - 1) * limit).limit(limit).lean(),
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

export async function listMyProducts(req, res, next) {
  try {
    const query = req.sanitizedQuery
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 24, 1), 40)
    const filter = { seller: req.user._id }
    if (['Active', 'Sold', 'Pending', 'Rejected'].includes(query.status)) filter.status = query.status
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
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

export async function getMyProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' })
    }
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id }).lean()
    if (!product) return res.status(404).json({ success: false, message: 'Listing not found.' })
    return res.json({ success: true, data: product })
  } catch (error) {
    return next(error)
  }
}

export async function getProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' })
    }
    const product = await Product.findOne({ _id: req.params.id, status: 'Active' })
      .populate('seller', 'name profileImage location createdAt')
      .lean()
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }
    return res.json({ success: true, data: product })
  } catch (error) {
    return next(error)
  }
}

export async function createProduct(req, res, next) {
  try {
    const product = await Product.create({
      ...productValues(req.body, req.files),
      seller: req.user._id,
      status: 'Pending',
    })
    return res.status(201).json({ success: true, data: product, message: 'Listing submitted for review.' })
  } catch (error) {
    await removeUploadedImages((req.files ?? []).map(imageUrl)).catch((cleanupError) => console.error(cleanupError))
    return next(error)
  }
}

export async function updateProduct(req, res, next) {
  let persisted = false
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      await removeUploadedImages((req.files ?? []).map(imageUrl))
      return res.status(400).json({ success: false, message: 'Invalid product ID.' })
    }
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id })
    if (!product) {
      await removeUploadedImages((req.files ?? []).map(imageUrl))
      return res.status(404).json({ success: false, message: 'Listing not found.' })
    }
    if (product.status === 'Sold') {
      await removeUploadedImages((req.files ?? []).map(imageUrl))
      return res.status(400).json({ success: false, message: 'Sold listings cannot be edited.' })
    }

    const updates = productValues(req.body, req.files)
    const previousImages = [...product.images]
    let remainingImages = product.images
    if (typeof req.body.existingImages === 'string') {
      try {
        const requestedImages = JSON.parse(req.body.existingImages)
        if (!Array.isArray(requestedImages) || requestedImages.some((image) => typeof image !== 'string')) {
          await removeUploadedImages((req.files ?? []).map(imageUrl))
          return res.status(400).json({ success: false, message: 'Existing product images are invalid.' })
        }
        remainingImages = product.images.filter((image) => requestedImages.includes(image))
      } catch {
        await removeUploadedImages((req.files ?? []).map(imageUrl))
        return res.status(400).json({ success: false, message: 'Existing product images are invalid.' })
      }
    }
    const newImages = (req.files ?? []).map(imageUrl)
    if (remainingImages.length + newImages.length < 1 || remainingImages.length + newImages.length > 6) {
      await removeUploadedImages(newImages)
      return res.status(400).json({ success: false, message: 'A listing must have between 1 and 6 images.' })
    }
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) product[key] = value
    }
    product.images = [...remainingImages, ...newImages]
    if (product.status !== 'Pending') product.status = 'Pending'
    await product.save()
    persisted = true
    await removeUploadedImages(previousImages.filter((image) => !product.images.includes(image)))
    return res.json({ success: true, data: product, message: 'Listing updated and sent for review.' })
  } catch (error) {
    if (!persisted) {
      await removeUploadedImages((req.files ?? []).map(imageUrl)).catch((cleanupError) => console.error(cleanupError))
    }
    return next(error)
  }
}

export async function deleteProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' })
    }
    const product = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user._id })
    if (!product) return res.status(404).json({ success: false, message: 'Listing not found.' })
    await removeUploadedImages(product.images)
    return res.json({ success: true, message: 'Listing deleted.' })
  } catch (error) {
    return next(error)
  }
}

export async function updateProductStatus(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' })
    }
    if (req.body.status !== 'Sold') {
      return res.status(400).json({ success: false, message: 'Sellers can mark active listings as sold.' })
    }
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: req.user._id, status: 'Active' },
      { status: 'Sold' },
      { new: true, runValidators: true },
    )
    if (!product) return res.status(404).json({ success: false, message: 'Listing not found or cannot change status.' })
    return res.json({ success: true, data: product })
  } catch (error) {
    return next(error)
  }
}

export async function contactSeller(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' })
    }
    const product = await Product.findOne({ _id: req.params.id, status: 'Active' }).select('title seller')
    if (!product) return res.status(404).json({ success: false, message: 'This find is no longer available.' })
    if (product.seller?.equals(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You are the seller of this listing.' })
    }
    await Notification.create({
      user: product.seller,
      title: 'Someone is interested in your listing',
      message: `${req.user.name} is interested in “${product.title}”.`,
      type: 'message',
      link: `/products/${product._id}`,
    })
    return res.json({ success: true, message: 'Your interest was shared with the seller. Your email and phone were not shared.' })
  } catch (error) {
    return next(error)
  }
}
