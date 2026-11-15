import mongoose from 'mongoose'
import Notification from '../models/Notification.js'

export async function listNotifications(req, res, next) {
  try {
    const page = Math.max(Number.parseInt(req.sanitizedQuery.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(req.sanitizedQuery.limit, 10) || 30, 1), 50)
    const filter = { user: req.user._id }
    const [notifications, total, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, read: false }),
    ])
    return res.json({ success: true, data: notifications, pagination: { page, limit, total, unread } })
  } catch (error) {
    return next(error)
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID.' })
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true },
    )
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' })
    return res.json({ success: true, data: notification })
  } catch (error) {
    return next(error)
  }
}
