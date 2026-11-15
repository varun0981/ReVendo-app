import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import productRoutes from './routes/productRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import userRoutes from './routes/userRoutes.js'
import wishlistRoutes from './routes/wishlistRoutes.js'
import { uploadDirectory } from './utils/uploads.js'

const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use((req, _res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body)
  req.sanitizedQuery = mongoSanitize.sanitize(req.query)
  next()
})
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
)
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'ReVendo API is running.' })
})
app.use('/uploads', express.static(uploadDirectory, { dotfiles: 'deny', maxAge: '1d', immutable: true }))
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/reports', reportRoutes)
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' })
})
app.use((error, _req, res, _next) => {
  if (error.name === 'MulterError') {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    return res.status(status).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 5 MB or smaller.' : error.message })
  }
  if (error.message === 'Only JPEG, PNG, and WebP images are allowed.') {
    return res.status(400).json({ success: false, message: error.message })
  }
  console.error(error)
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : 'An unexpected server error occurred.',
  })
})

export default app
