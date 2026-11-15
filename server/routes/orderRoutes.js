import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import {
  createOrders, createReview, getOrder, getPendingPayment, listMyOrders, updateOrderStatus, verifyRazorpayPayment,
} from '../controllers/orderController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const validate = (req, res, next) => {
  const result = validationResult(req)
  if (!result.isEmpty()) return res.status(400).json({ success: false, message: result.array()[0].msg })
  return next()
}

const shippingAddressRules = [
  body('shippingAddress.name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter the recipient name.'),
  body('shippingAddress.phone').matches(/^\+[1-9]\d{7,14}$/).withMessage('Enter a valid phone number with country code.'),
  body('shippingAddress.addressLine').trim().isLength({ min: 5, max: 200 }).withMessage('Enter a complete delivery address.'),
  body('shippingAddress.city').trim().isLength({ min: 2, max: 80 }).withMessage('Enter a city.'),
  body('shippingAddress.state').trim().isLength({ min: 2, max: 80 }).withMessage('Enter a state.'),
  body('shippingAddress.postalCode').trim().isLength({ min: 4, max: 12 }).withMessage('Enter a valid postal code.'),
]

router.use(requireAuth)
router.post(
  '/',
  body('productIds').isArray({ min: 1, max: 20 }).withMessage('Your bag must contain 1 to 20 available finds.'),
  body('paymentMethod').optional({ values: 'falsy' }).isIn(['Cash on delivery (demo)', 'Razorpay test mode']).withMessage('Choose a supported payment method.'),
  ...shippingAddressRules,
  validate,
  createOrders,
)
router.get('/:id/payment', getPendingPayment)
router.post(
  '/payment/verify',
  body('razorpay_order_id').matches(/^order_[A-Za-z0-9]+$/).withMessage('Razorpay order ID is invalid.'),
  body('razorpay_payment_id').matches(/^pay_[A-Za-z0-9]+$/).withMessage('Razorpay payment ID is invalid.'),
  body('razorpay_signature').matches(/^[a-fA-F0-9]{64}$/).withMessage('Razorpay payment signature is invalid.'),
  validate,
  verifyRazorpayPayment,
)
router.get('/my-orders', listMyOrders)
router.get('/:id', getOrder)
router.patch('/:id/status', body('status').isIn(['Confirmed', 'Shipped', 'Delivered', 'Cancelled']).withMessage('Choose a valid order status.'), validate, updateOrderStatus)
router.post('/:id/review', body('rating').isInt({ min: 1, max: 5 }).withMessage('Choose a rating from 1 to 5.'), body('comment').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Review is too long.'), validate, createReview)
export default router
