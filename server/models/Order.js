import mongoose from 'mongoose'

const orderProductSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    products: { type: [orderProductSchema], required: true, validate: [(items) => items.length > 0, 'An order needs at least one product.'] },
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAddress: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      addressLine: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
    },
    paymentMethod: { type: String, enum: ['Cash on delivery (demo)', 'Razorpay test mode'], default: 'Cash on delivery (demo)' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Refunded'], default: 'Pending' },
    razorpayOrderId: { type: String, select: false },
    razorpayPaymentId: { type: String, select: false },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
  },
  { timestamps: true },
)

orderSchema.index({ buyer: 1, createdAt: -1 })
orderSchema.index({ seller: 1, createdAt: -1 })
orderSchema.index({ buyer: 1, razorpayOrderId: 1 })

export default mongoose.model('Order', orderSchema)
