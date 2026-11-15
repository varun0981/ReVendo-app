import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import {
  currentUser, forgotPassword, login, logout, register, resetPassword,
  sendOtp, verifyEmail, verifyOtp,
} from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const handleValidation = (req, res, next) => {
  const result = validationResult(req)
  if (!result.isEmpty()) {
    return res.status(400).json({ success: false, message: result.array()[0].msg })
  }
  return next()
}

const email = body('email').isEmail().withMessage('Enter a valid email address.').normalizeEmail()
const password = body('password').isString().isLength({ min: 8, max: 72 }).withMessage('Password must be 8–72 characters.')

router.post(
  '/register',
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
  email,
  body('phone').matches(/^\+[1-9]\d{7,14}$/).withMessage('Enter a valid mobile number with country code.'),
  password,
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match.'),
  body('acceptTerms').isBoolean().toBoolean().custom((value) => value === true).withMessage('Accept the terms to create an account.'),
  handleValidation,
  register,
)
router.post('/login', email, body('password').isString().notEmpty().withMessage('Enter your password.'), handleValidation, login)
router.post('/logout', logout)
router.get('/me', requireAuth, currentUser)
router.post('/verify-email', email, body('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Verification token is invalid.'), handleValidation, verifyEmail)
router.post('/send-otp', email, handleValidation, sendOtp)
router.post('/verify-otp', email, body('otp').matches(/^\d{6}$/).withMessage('Enter the six-digit mobile code.'), handleValidation, verifyOtp)
router.post('/forgot-password', email, handleValidation, forgotPassword)
router.post(
  '/reset-password',
  email,
  body('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Reset token is invalid.'),
  password,
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match.'),
  handleValidation,
  resetPassword,
)

export default router
