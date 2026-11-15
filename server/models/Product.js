import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: {
      type: String,
      enum: ['Electronics', 'Mobiles', 'Laptops', 'Fashion', 'Furniture', 'Home Appliances', 'Books', 'Sports', 'Vehicles', 'Gaming', 'Accessories', 'Other'],
      required: true,
      trim: true,
      index: true,
    },
    brand: { type: String, trim: true, default: '' },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    condition: {
      type: String,
      enum: ['Like New', 'Excellent', 'Good', 'Fair'],
      required: true,
    },
    images: { type: [String], default: [] },
    location: { type: String, required: true, trim: true },
    negotiable: { type: Boolean, default: false },
    contactPreferences: { type: [String], enum: ['chat', 'phone', 'email'], default: ['chat'] },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    soldTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, select: false },
    soldInOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, select: false },
    soldAt: { type: Date, default: null, select: false },
    status: {
      type: String,
      enum: ['Active', 'Sold', 'Pending', 'Rejected'],
      default: 'Active',
      index: true,
    },
    moderationNote: { type: String, default: '', maxlength: 500, select: false },
  },
  { timestamps: true },
)

productSchema.index({ title: 'text', description: 'text', brand: 'text' })
productSchema.index({ status: 1, createdAt: -1 })
productSchema.index({ category: 1, price: 1 })

export default mongoose.model('Product', productSchema)
