import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    type: { type: String, enum: ['order', 'listing', 'account', 'message'], default: 'account' },
    read: { type: Boolean, default: false },
    link: { type: String, default: '' },
  },
  { timestamps: true },
)

notificationSchema.index({ user: 1, read: 1, createdAt: -1 })
export default mongoose.model('Notification', notificationSchema)
