import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import {
  approveProduct, dashboard, deleteAdminProduct, listAdminOrders, listAdminProducts,
  listAdminUsers, listReports, rejectProduct, setUserStatus, updateReport,
} from '../controllers/adminController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()
const validate = (req, res, next) => {
  const result = validationResult(req)
  if (!result.isEmpty()) return res.status(400).json({ success: false, message: result.array()[0].msg })
  return next()
}

router.use(requireAuth, requireAdmin)
router.get('/dashboard', dashboard)
router.get('/users', listAdminUsers)
router.patch('/users/:id/status', body('status').isIn(['Active', 'Suspended']).withMessage('Choose Active or Suspended.'), validate, setUserStatus)
router.get('/products', listAdminProducts)
router.patch('/products/:id/approve', approveProduct)
router.patch('/products/:id/reject', body('reason').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Rejection note must be 500 characters or fewer.'), validate, rejectProduct)
router.delete('/products/:id', deleteAdminProduct)
router.get('/orders', listAdminOrders)
router.get('/reports', listReports)
router.patch(
  '/reports/:id',
  body('status').isIn(['New', 'In review', 'Resolved', 'Dismissed']).withMessage('Choose a valid report status.'),
  body('resolutionNote').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Resolution note is too long.'),
  validate,
  updateReport,
)

export default router
