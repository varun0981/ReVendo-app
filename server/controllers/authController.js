import { randomInt } from 'node:crypto'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { sendAccountEmail } from '../services/emailService.js'
import { sendMobileCode } from '../services/smsService.js'
import { createOpaqueToken, hashToken } from '../utils/tokens.js'
import { clearSessionCookie, setSessionCookie } from '../middleware/auth.js'

function safeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    profileImage: user.profileImage,
    bio: user.bio,
    location: user.location,
    role: user.role,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
  }
}

function getClientUrl() {
  return process.env.CLIENT_URL || 'http://localhost:5173'
}

export async function register(req, res, next) {
  try {
    const { name, email, phone, password } = req.body
    const existing = await User.findOne({ $or: [{ email }, { phone }] })
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account already uses that email or mobile number.' })
    }

    const emailToken = createOpaqueToken()
    const user = await User.create({
      name,
      email,
      phone,
      password,
      termsAcceptedAt: new Date(),
      emailVerificationToken: hashToken(emailToken),
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    const verificationUrl = `${getClientUrl()}/verify-email?email=${encodeURIComponent(email)}&token=${emailToken}`
    let delivered
    try {
      delivered = await sendAccountEmail({
        to: email,
        subject: 'Verify your ReVendo email',
        text: `Welcome to ReVendo. Verify your email within 24 hours: ${verificationUrl}`,
        html: `<p>Welcome to ReVendo. <a href="${verificationUrl}">Verify your email address</a> within 24 hours.</p>`,
      })
    } catch (error) {
      await user.deleteOne()
      return next(error)
    }

    const response = { success: true, message: 'Account created. Verify your email to continue.', data: { user: safeUser(user) } }
    if (!delivered && process.env.NODE_ENV === 'development') {
      response.developmentEmailLink = verificationUrl
      response.deliveryMode = 'development simulation — no email was sent'
    }
    return res.status(201).json(response)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account already uses that email or mobile number.' })
    }
    return next(error)
  }
}

export async function login(req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password')
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).json({ success: false, message: 'Email or password is incorrect.' })
    }
    if (!user.emailVerified) {
      return res.status(403).json({ success: false, code: 'EMAIL_NOT_VERIFIED', message: 'Verify your email before signing in.' })
    }
    if (!user.phoneVerified) {
      return res.status(403).json({ success: false, code: 'PHONE_NOT_VERIFIED', message: 'Verify your mobile number before signing in.' })
    }
    if (user.accountStatus !== 'Active') {
      return res.status(403).json({ success: false, message: 'This account has been suspended. Contact ReVendo support.' })
    }
    setSessionCookie(res, user._id.toString())
    return res.json({ success: true, data: { user: safeUser(user) } })
  } catch (error) {
    return next(error)
  }
}

export function logout(_req, res) {
  clearSessionCookie(res)
  return res.json({ success: true, message: 'You are signed out.' })
}

export async function currentUser(req, res) {
  return res.json({ success: true, data: { user: safeUser(req.user) } })
}

export async function verifyEmail(req, res, next) {
  try {
    const user = await User.findOne({
      email: req.body.email,
      emailVerificationToken: hashToken(req.body.token),
      emailVerificationExpiresAt: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpiresAt')
    if (!user) {
      return res.status(400).json({ success: false, message: 'That verification link is invalid or has expired.' })
    }

    user.emailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpiresAt = undefined
    await user.save()
    return res.json({ success: true, message: 'Email verified. You can now verify your mobile number.' })
  } catch (error) {
    return next(error)
  }
}

export async function sendOtp(req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+phoneOtpHash +phoneOtpExpiresAt')
    if (!user || !user.emailVerified) {
      return res.status(400).json({ success: false, message: 'Verify the registered email before requesting a mobile code.' })
    }
    if (user.phoneVerified) {
      return res.status(400).json({ success: false, message: 'This mobile number is already verified.' })
    }

    const development = process.env.NODE_ENV === 'development' && !process.env.TWILIO_ACCOUNT_SID
    const code = development ? '123456' : randomInt(100000, 1000000).toString()
    user.phoneOtpHash = hashToken(code)
    user.phoneOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()
    const delivered = await sendMobileCode(user.phone, code)
    const response = { success: true, message: 'A verification code has been sent to your mobile number.' }
    if (!delivered && process.env.NODE_ENV === 'development') {
      response.developmentOtp = code
      response.deliveryMode = 'development simulation — no SMS was sent'
    }
    return res.json(response)
  } catch (error) {
    return next(error)
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+phoneOtpHash +phoneOtpExpiresAt')
    if (
      !user ||
      !user.phoneOtpHash ||
      user.phoneOtpHash !== hashToken(req.body.otp) ||
      !user.phoneOtpExpiresAt ||
      user.phoneOtpExpiresAt <= new Date()
    ) {
      return res.status(400).json({ success: false, message: 'That mobile code is incorrect or has expired.' })
    }

    user.phoneVerified = true
    user.phoneOtpHash = undefined
    user.phoneOtpExpiresAt = undefined
    await user.save()
    return res.json({ success: true, message: 'Mobile number verified. You can now sign in.' })
  } catch (error) {
    return next(error)
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+passwordResetToken +passwordResetExpiresAt')
    const response = { success: true, message: 'If that email belongs to an account, password reset instructions have been sent.' }
    if (!user) return res.json(response)

    const token = createOpaqueToken()
    user.passwordResetToken = hashToken(token)
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000)
    await user.save()
    const resetUrl = `${getClientUrl()}/reset-password?email=${encodeURIComponent(user.email)}&token=${token}`
    const delivered = await sendAccountEmail({
      to: user.email,
      subject: 'Reset your ReVendo password',
      text: `Reset your ReVendo password within 30 minutes: ${resetUrl}`,
      html: `<p><a href="${resetUrl}">Reset your ReVendo password</a> within 30 minutes.</p>`,
    })
    if (!delivered && process.env.NODE_ENV === 'development') {
      response.developmentResetLink = resetUrl
      response.deliveryMode = 'development simulation — no email was sent'
    }
    return res.json(response)
  } catch (error) {
    return next(error)
  }
}

export async function resetPassword(req, res, next) {
  try {
    const user = await User.findOne({
      email: req.body.email,
      passwordResetToken: hashToken(req.body.token),
      passwordResetExpiresAt: { $gt: new Date() },
    }).select('+password +passwordResetToken +passwordResetExpiresAt')
    if (!user) {
      return res.status(400).json({ success: false, message: 'That password reset link is invalid or has expired.' })
    }

    user.password = req.body.password
    user.passwordResetToken = undefined
    user.passwordResetExpiresAt = undefined
    await user.save()
    return res.json({ success: true, message: 'Password updated. You can now sign in with your new password.' })
  } catch (error) {
    return next(error)
  }
}
