import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const cookieName = 'revendo_session'

export function setSessionCookie(res, userId) {
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

export function clearSessionCookie(res) {
  res.clearCookie(cookieName, { httpOnly: true, sameSite: 'lax', path: '/' })
}

export async function requireAuth(req, res, next) {
  let payload
  try {
    const token = req.cookies?.[cookieName]
    if (!token) {
      return res.status(401).json({ success: false, message: 'Please sign in to continue.' })
    }
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    clearSessionCookie(res)
    return res.status(401).json({ success: false, message: 'Your session is invalid or has expired.' })
  }

  try {
    const user = await User.findById(payload.sub)
    if (!user) {
      clearSessionCookie(res)
      return res.status(401).json({ success: false, message: 'Your session is no longer valid.' })
    }
    if (user.accountStatus !== 'Active') {
      clearSessionCookie(res)
      return res.status(403).json({ success: false, message: 'This account has been suspended. Contact ReVendo support.' })
    }
    req.user = user
    return next()
  } catch (error) {
    return next(error)
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Administrator access is required.' })
  }
  return next()
}
