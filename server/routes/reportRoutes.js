import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { reportProduct } from '../controllers/reportController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.post(
  '/:id',
  requireAuth,
  body('reason').isIn(['Inappropriate', 'Scam or fraud', 'Counterfeit', 'Incorrect information', 'Other']).withMessage('Choose a report reason.'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Report details are too long.'),
  (req, res, next) => {
    const result = validationResult(req)
    if (!result.isEmpty()) return res.status(400).json({ success: false, message: result.array()[0].msg })
    return next()
  },
  reportProduct,
)
export default router
