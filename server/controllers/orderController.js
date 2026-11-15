import mongoose from 'mongoose'
import Cart from '../models/Cart.js'
import Notification from '../models/Notification.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Review from '../models/Review.js'
import { createRazorpayOrder, getRazorpayKeyId, verifyRazorpaySignature } from '../services/razorpayService.js'

function orderError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

export async function createOrders(req, res, next) {
  const buyerId = req.user._id
  const reservedProducts = []
  const reservedOrderIds = new Set()
  const createdOrderIds = []
  const onlinePayment = req.body.paymentMethod === 'Razorpay test mode'

  try {
    const productIds = [...new Set(req.body.productIds)]
    if (productIds.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({ success: false, message: 'One or more product IDs are invalid.' })
    }
    const products = await Product.find({ _id: { $in: productIds }, status: 'Active' })
      .select('+soldTo')
      .lean()
    if (products.length !== productIds.length) {
      return res.status(409).json({ success: false, message: 'One or more finds are no longer available.' })
    }
    if (products.some((product) => product.seller?.equals(buyerId))) {
      return res.status(400).json({ success: false, message: 'You cannot purchase your own listing.' })
    }

    const groups = new Map()
    for (const product of products) {
      const sellerId = product.seller.toString()
      if (!groups.has(sellerId)) groups.set(sellerId, { seller: product.seller, products: [], orderId: new mongoose.Types.ObjectId() })
      groups.get(sellerId).products.push(product)
    }

    for (const group of groups.values()) {
      for (const product of group.products) {
        const reserved = await Product.findOneAndUpdate(
          { _id: product._id, status: 'Active', seller: { $ne: buyerId } },
          {
            $set: { status: 'Sold', soldTo: buyerId, soldInOrder: group.orderId, soldAt: new Date() },
          },
          { new: true },
        )
        if (!reserved) throw orderError(409, 'A find was just purchased by someone else. Refresh your bag and try again.')
        reservedProducts.push(product._id)
        reservedOrderIds.add(group.orderId.toString())
      }
    }

    const orderDocuments = [...groups.values()].map((group) => ({
      _id: group.orderId,
      buyer: buyerId,
      seller: group.seller,
      products: group.products.map((product) => ({
        product: product._id,
        title: product.title,
        price: product.price,
        image: product.images[0] || '',
      })),
      totalAmount: group.products.reduce((sum, product) => sum + product.price, 0),
      shippingAddress: req.body.shippingAddress,
      paymentMethod: onlinePayment ? 'Razorpay test mode' : 'Cash on delivery (demo)',
    }))
    createdOrderIds.push(...orderDocuments.map((order) => order._id))
    const orders = await Order.insertMany(orderDocuments)
    let payment
    if (onlinePayment) {
      const amount = Math.round(orderDocuments.reduce((sum, order) => sum + order.totalAmount, 0) * 100)
      const gatewayOrder = await createRazorpayOrder({
        amount,
        receipt: orders[0]._id.toString(),
        notes: { buyerId: buyerId.toString() },
      })
      const linkedOrders = await Order.updateMany(
        { _id: { $in: createdOrderIds }, buyer: buyerId, paymentStatus: 'Pending' },
        { razorpayOrderId: gatewayOrder.id },
      )
      if (linkedOrders.matchedCount !== createdOrderIds.length) {
        throw orderError(409, 'Could not link the payment to every order. Please try again.')
      }
      payment = {
        keyId: gatewayOrder.keyId,
        orderId: gatewayOrder.id,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency,
        internalOrderId: orders[0]._id,
      }
    } else {
      await Notification.insertMany(orders.map((order) => ({
        user: order.seller,
        title: 'A new order is waiting',
        message: `You have a new order for ${order.products.length} ${order.products.length === 1 ? 'find' : 'finds'}.`,
        type: 'order',
        link: `/orders/${order._id}`,
      })))
    }
    await Cart.findOneAndUpdate({ user: buyerId }, { $pull: { products: { $in: productIds } } })
    return res.status(201).json({
      success: true,
      data: orders,
      ...(payment ? { payment } : {}),
      message: onlinePayment ? 'Test payment order created. Complete payment to confirm your order.' : 'Order placed. Payment is due on delivery; no online payment was processed.',
    })
  } catch (error) {
    if (createdOrderIds.length) {
      await Order.deleteMany({ _id: { $in: createdOrderIds } }).catch((cleanupError) => console.error(cleanupError))
    }
    if (reservedProducts.length) {
      await Product.updateMany(
        { _id: { $in: reservedProducts }, soldInOrder: { $in: [...reservedOrderIds] } },
        { $set: { status: 'Active' }, $unset: { soldTo: '', soldInOrder: '', soldAt: '' } },
      ).catch((cleanupError) => console.error(cleanupError))
    }
    return next(error)
  }
}

export async function getPendingPayment(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID.' })
    }
    const order = await Order.findOne({
      _id: req.params.id,
      buyer: req.user._id,
      paymentMethod: 'Razorpay test mode',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
    }).select('+razorpayOrderId')
    if (!order?.razorpayOrderId) {
      return res.status(404).json({ success: false, message: 'No pending Razorpay payment was found for this order.' })
    }
    const relatedOrders = await Order.find({ buyer: req.user._id, razorpayOrderId: order.razorpayOrderId, paymentStatus: 'Pending' }).select('totalAmount')
    const amount = Math.round(relatedOrders.reduce((sum, item) => sum + item.totalAmount, 0) * 100)
    return res.json({
      success: true,
      data: {
        keyId: getRazorpayKeyId(),
        orderId: order.razorpayOrderId,
        amount,
        currency: 'INR',
        internalOrderId: order._id,
      },
    })
  } catch (error) {
    return next(error)
  }
}

export async function verifyRazorpayPayment(req, res, next) {
  try {
    const { razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId, razorpay_signature: signature } = req.body
    const orders = await Order.find({ buyer: req.user._id, razorpayOrderId }).select('+razorpayOrderId +razorpayPaymentId')
    if (!orders.length || orders.some((order) => order.paymentMethod !== 'Razorpay test mode')) {
      return res.status(404).json({ success: false, message: 'The payment order was not found.' })
    }
    if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, signature)) {
      return res.status(400).json({ success: false, message: 'Razorpay payment verification failed. Your order has not been marked paid.' })
    }

    const alreadyPaid = orders.every((order) => order.paymentStatus === 'Paid' && order.razorpayPaymentId === razorpayPaymentId)
    if (alreadyPaid) {
      return res.json({ success: true, data: { orderIds: orders.map((order) => order._id), paymentStatus: 'Paid' }, message: 'Payment was already verified.' })
    }
    if (orders.some((order) => (
      (order.paymentStatus === 'Paid' && order.razorpayPaymentId !== razorpayPaymentId) ||
      (order.paymentStatus === 'Pending' && order.orderStatus !== 'Pending') ||
      !['Pending', 'Paid'].includes(order.paymentStatus)
    ))) {
      return res.status(409).json({ success: false, message: 'This order is no longer awaiting payment.' })
    }

    const pendingOrderIds = orders.filter((order) => order.paymentStatus === 'Pending').map((order) => order._id)
    const updated = await Order.updateMany(
      { _id: { $in: pendingOrderIds }, buyer: req.user._id, paymentStatus: 'Pending', orderStatus: 'Pending' },
      { $set: { paymentStatus: 'Paid', orderStatus: 'Confirmed', razorpayPaymentId } },
    )
    const verifiedOrders = await Order.find({ buyer: req.user._id, razorpayOrderId }).select('+razorpayOrderId +razorpayPaymentId')
    if (verifiedOrders.length !== orders.length || verifiedOrders.some((order) => (
      order.paymentStatus !== 'Paid' || order.razorpayPaymentId !== razorpayPaymentId
    ))) {
      return res.status(409).json({ success: false, message: 'Payment confirmation is still being processed. Refresh your orders shortly.' })
    }

    if (updated.modifiedCount) {
      try {
        await Notification.insertMany(verifiedOrders.map((order) => ({
          user: order.seller,
          title: 'A new order is waiting',
          message: `You have a new order for ${order.products.length} ${order.products.length === 1 ? 'find' : 'finds'}. Payment is confirmed.`,
          type: 'order',
          link: `/orders/${order._id}`,
        })))
      } catch (notificationError) {
        console.error('Unable to notify sellers about a verified payment.', notificationError)
      }
    }
    return res.json({
      success: true,
      data: { orderIds: verifiedOrders.map((order) => order._id), paymentStatus: 'Paid' },
      message: 'Payment verified and order confirmed.',
    })
  } catch (error) {
    return next(error)
  }
}

export async function listMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ $or: [{ buyer: req.user._id }, { seller: req.user._id }] })
      .populate('buyer', 'name profileImage')
      .populate('seller', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
    return res.json({ success: true, data: orders })
  } catch (error) {
    return next(error)
  }
}

export async function getOrder(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID.' })
    }
    const order = await Order.findOne({ _id: req.params.id, $or: [{ buyer: req.user._id }, { seller: req.user._id }] })
      .populate('buyer', 'name profileImage')
      .populate('seller', 'name profileImage location')
      .lean()
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' })
    const reviewSubmitted = await Review.exists({ order: order._id, reviewer: req.user._id })
    return res.json({ success: true, data: { ...order, reviewSubmitted: Boolean(reviewSubmitted) } })
  } catch (error) {
    return next(error)
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID.' })
    }
    const order = await Order.findById(req.params.id)
    if (!order || (req.user.role !== 'Admin' && !order.buyer.equals(req.user._id) && !order.seller.equals(req.user._id))) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    const requestedStatus = req.body.status
    const isAdmin = req.user.role === 'Admin'
    const isSeller = order.seller.equals(req.user._id)
    if (order.paymentMethod === 'Razorpay test mode' && order.paymentStatus !== 'Paid') {
      return res.status(409).json({ success: false, message: 'This order cannot be updated until payment is verified.' })
    }
    const allowedTransitions = isSeller
      ? { Pending: 'Confirmed', Confirmed: 'Shipped', Shipped: 'Delivered' }
      : { Pending: 'Cancelled', Confirmed: 'Cancelled' }
    if ((!isAdmin && allowedTransitions[order.orderStatus] !== requestedStatus) ||
      (isAdmin && !['Confirmed', 'Shipped', 'Delivered', 'Cancelled'].includes(requestedStatus))) {
      return res.status(400).json({ success: false, message: 'That order status change is not allowed.' })
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, orderStatus: order.orderStatus },
      { orderStatus: requestedStatus },
      { new: true, runValidators: true },
    )
    if (!updatedOrder) throw orderError(409, 'This order changed while you were updating it. Refresh and try again.')
    if (requestedStatus === 'Cancelled') {
      await Product.updateMany(
        { _id: { $in: order.products.map((item) => item.product) }, soldInOrder: order._id, status: 'Sold' },
        { $set: { status: 'Active' }, $unset: { soldTo: '', soldInOrder: '', soldAt: '' } },
      )
    }
    await Notification.create({
      user: isSeller || isAdmin ? order.buyer : order.seller,
      title: `Order ${requestedStatus.toLowerCase()}`,
      message: `Your order status is now ${requestedStatus.toLowerCase()}.`,
      type: 'order',
      link: `/orders/${updatedOrder._id}`,
    })
    return res.json({ success: true, data: updatedOrder })
  } catch (error) {
    return next(error)
  }
}

export async function createReview(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID.' })
    }
    const order = await Order.findOne({ _id: req.params.id, buyer: req.user._id, orderStatus: 'Delivered' })
    if (!order) return res.status(404).json({ success: false, message: 'A review is available after a delivered order.' })
    const review = await Review.create({
      reviewer: req.user._id,
      seller: order.seller,
      order: order._id,
      rating: req.body.rating,
      comment: req.body.comment || '',
    })
    await Notification.create({
      user: order.seller,
      title: 'A new seller review',
      message: `A buyer left you a ${review.rating}-star review.`,
      type: 'account',
      link: `/sellers/${order.seller}`,
    })
    return res.status(201).json({ success: true, data: review, message: 'Thank you for sharing your experience.' })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'You have already reviewed this order.' })
    return next(error)
  }
}
