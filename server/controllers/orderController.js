const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      couponCode
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items'
      });
    }

    // Verify stock availability and update product info
    for (let item of orderItems) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.name}`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      // Update item with current product info
      item.name = product.name;
      item.price = product.price;
      item.image = product.images[0]?.url || '';
    }

    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentInfo: {
        method: paymentMethod,
        status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending'
      },
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      couponCode
    });

    const createdOrder = await order.save();

    // Update product stock and sold count
    for (let item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            stock: -item.quantity,
            soldCount: item.quantity
          }
        }
      );
    }

    // Send order confirmation email
    try {
      const populatedOrder = await Order.findById(createdOrder._id)
        .populate('user', 'name email');
      
      const confirmationEmail = emailTemplates.orderConfirmation(populatedOrder);
      await sendEmail({
        email: populatedOrder.user.email,
        subject: confirmationEmail.subject,
        html: confirmationEmail.html
      });
    } catch (error) {
      console.log('Error sending order confirmation email:', error.message);
    }

    res.status(201).json({
      success: true,
      order: createdOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Make sure user owns order or is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Order.countDocuments({ user: req.user.id });
    
    const orders = await Order.find({ user: req.user.id })
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit)
      .populate('orderItems.product', 'name images');

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      orders
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};

    // Filter by status
    if (req.query.status) {
      query.orderStatus = req.query.status;
    }

    // Filter by payment status
    if (req.query.paymentStatus) {
      query['paymentInfo.status'] = req.query.paymentStatus;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const total = await Order.countDocuments(query);
    
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, carrier, note } = req.body;

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status
    order.orderStatus = status;
    
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    
    if (carrier) {
      order.carrier = carrier;
    }

    // Set specific timestamps
    if (status === 'shipped') {
      order.shippedAt = Date.now();
    } else if (status === 'delivered') {
      order.deliveredAt = Date.now();
    } else if (status === 'cancelled') {
      order.cancelledAt = Date.now();
    }

    // Add note to status history
    if (note) {
      order.statusHistory[order.statusHistory.length - 1].note = note;
    }

    await order.save();

    // Send status update email
    try {
      const statusEmail = emailTemplates.orderStatusUpdate(order);
      await sendEmail({
        email: order.user.email,
        subject: statusEmail.subject,
        html: statusEmail.html
      });
    } catch (error) {
      console.log('Error sending status update email:', error.message);
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Process stripe payment
// @route   POST /api/orders/:id/pay
// @access  Private
exports.processPayment = async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Make sure user owns order
    if (order.user._id.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to pay for this order'
      });
    }

    try {
      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.totalPrice * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        metadata: {
          orderId: order._id.toString(),
          userId: req.user.id
        }
      });

      if (paymentIntent.status === 'succeeded') {
        // Update order payment info
        order.paymentInfo.status = 'completed';
        order.paymentInfo.transactionId = paymentIntent.id;
        order.paymentInfo.paidAt = Date.now();
        order.orderStatus = 'confirmed';

        await order.save();

        res.status(200).json({
          success: true,
          message: 'Payment successful',
          order
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Payment failed',
          error: paymentIntent.last_payment_error?.message
        });
      }
    } catch (stripeError) {
      console.error('Stripe payment error:', stripeError);
      res.status(400).json({
        success: false,
        message: 'Payment processing failed',
        error: stripeError.message
      });
    }
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Make sure user owns order or is admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Update order
    order.orderStatus = 'cancelled';
    order.cancelledAt = Date.now();
    order.cancellationReason = reason;

    await order.save();

    // Restore product stock
    for (let item of order.orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            stock: item.quantity,
            soldCount: -item.quantity
          }
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};