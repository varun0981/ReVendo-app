import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true },
)

reviewSchema.index({ order: 1, reviewer: 1 }, { unique: true })
reviewSchema.index({ seller: 1, createdAt: -1 })
export default mongoose.model('Review', reviewSchema)
