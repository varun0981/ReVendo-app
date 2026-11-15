import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import {
  contactSeller, createProduct, deleteProduct, getMyProduct, getProduct, listMyProducts, listProducts, updateProduct, updateProductStatus,
} from '../controllers/productController.js'
import { requireAuth } from '../middleware/auth.js'
import { imageUpload, imageUrl, removeUploadedImages, verifyUploadedImages } from '../utils/uploads.js'

const router = Router()
const categories = [
  'Electronics', 'Mobiles', 'Laptops', 'Fashion', 'Furniture', 'Home Appliances',
  'Books', 'Sports', 'Vehicles', 'Gaming', 'Accessories', 'Other',
]
const conditions = ['Like New', 'Excellent', 'Good', 'Fair']

function listingValidation({ requireImages }) {
  return [
    body('title').trim().isLength({ min: 4, max: 120 }).withMessage('Title must be between 4 and 120 characters.'),
    body('description').trim().isLength({ min: 15, max: 5000 }).withMessage('Description must be at least 15 characters.'),
    body('category').isIn(categories).withMessage('Choose a valid product category.'),
    body('brand').optional({ values: 'falsy' }).trim().isLength({ max: 80 }).withMessage('Brand is too long.'),
    body('price').isFloat({ min: 1, max: 100000000 }).withMessage('Enter a valid price in INR.'),
    body('originalPrice').optional({ values: 'falsy' }).isFloat({ min: 1, max: 100000000 }).withMessage('Enter a valid original price.'),
    body('condition').isIn(conditions).withMessage('Choose a valid product condition.'),
    body('location').trim().isLength({ min: 2, max: 100 }).withMessage('Enter a valid location.'),
    body('negotiable').isBoolean().withMessage('Choose whether the price is negotiable.'),
    async (req, res, next) => {
      const result = validationResult(req)
      if (!result.isEmpty()) {
        await removeUploadedImages((req.files ?? []).map(imageUrl))
        return res.status(400).json({ success: false, message: result.array()[0].msg })
      }
      if (requireImages && (!req.files || req.files.length < 1)) {
        return res.status(400).json({ success: false, message: 'Add at least one product image.' })
      }
      return next()
    },
  ]
}

router.get('/', listProducts)
router.get('/mine', requireAuth, listMyProducts)
router.get('/mine/:id', requireAuth, getMyProduct)
router.get('/:id', getProduct)
router.post('/', requireAuth, imageUpload.array('images', 6), verifyUploadedImages, listingValidation({ requireImages: true }), createProduct)
router.post('/:id/contact', requireAuth, contactSeller)
router.put('/:id', requireAuth, imageUpload.array('images', 6), verifyUploadedImages, listingValidation({ requireImages: false }), updateProduct)
router.delete('/:id', requireAuth, deleteProduct)
router.patch(
  '/:id/status',
  requireAuth,
  body('status').equals('Sold').withMessage('Sellers can mark active listings as sold.'),
  (req, res, next) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      return res.status(400).json({ success: false, message: result.array()[0].msg })
    }
    return next()
  },
  updateProductStatus,
)

export default router
