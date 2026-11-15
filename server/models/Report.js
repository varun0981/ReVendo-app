import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    reason: { type: String, enum: ['Inappropriate', 'Scam or fraud', 'Counterfeit', 'Incorrect information', 'Other'], required: true },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    status: { type: String, enum: ['New', 'In review', 'Resolved', 'Dismissed'], default: 'New', index: true },
    resolutionNote: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true },
)

reportSchema.index({ reporter: 1, product: 1 }, { unique: true })
export default mongoose.model('Report', reportSchema)
