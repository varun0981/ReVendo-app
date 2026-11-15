import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { changePassword, getMyProfile, getPublicProfile, getUserListings, updateProfile } from '../controllers/userController.js'
import { requireAuth } from '../middleware/auth.js'
import { imageUpload, verifyUploadedImages } from '../utils/uploads.js'

const router = Router()
const validate = (req, res, next) => {
  const result = validationResult(req)
  if (!result.isEmpty()) return res.status(400).json({ success: false, message: result.array()[0].msg })
  return next()
}

router.get('/profile', requireAuth, getMyProfile)
router.put(
  '/profile',
  requireAuth,
  imageUpload.single('profileImage'),
  verifyUploadedImages,
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
  body('location').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('Location is too long.'),
  body('bio').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Bio must be 500 characters or fewer.'),
  validate,
  updateProfile,
)
router.put(
  '/password',
  requireAuth,
  body('currentPassword').isString().notEmpty().withMessage('Enter your current password.'),
  body('newPassword').isString().isLength({ min: 8, max: 72 }).withMessage('New password must be 8–72 characters.'),
  body('confirmPassword').custom((value, { req }) => value === req.body.newPassword).withMessage('Passwords do not match.'),
  validate,
  changePassword,
)
router.get('/:id/listings', getUserListings)
router.get('/:id', getPublicProfile)

export default router
