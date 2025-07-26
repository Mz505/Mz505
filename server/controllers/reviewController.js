const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = { 
      product: req.params.productId,
      isApproved: true
    };

    // Filter by rating
    if (req.query.rating) {
      query.rating = parseInt(req.query.rating);
    }

    // Sort options
    let sortOption = '-createdAt'; // Default: newest first
    if (req.query.sort === 'oldest') {
      sortOption = 'createdAt';
    } else if (req.query.sort === 'highest') {
      sortOption = '-rating';
    } else if (req.query.sort === 'lowest') {
      sortOption = 'rating';
    } else if (req.query.sort === 'helpful') {
      sortOption = '-helpfulVotes';
    }

    const total = await Review.countDocuments(query);
    
    const reviews = await Review.find(query)
      .populate('user', 'name avatar')
      .sort(sortOption)
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      reviews
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { product, rating, title, comment, images } = req.body;

    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user.id,
      product
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Check if user has purchased this product
    const userOrder = await Order.findOne({
      user: req.user.id,
      'orderItems.product': product,
      orderStatus: 'delivered'
    });

    const reviewData = {
      user: req.user.id,
      product,
      rating,
      title,
      comment,
      images: images || [],
      verifiedPurchase: !!userOrder
    };

    const review = await Review.create(reviewData);

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      review: populatedReview
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Make sure user owns review
    if (review.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    const { rating, title, comment, images } = req.body;

    review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        rating,
        title,
        comment,
        images: images || review.images
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'name avatar');

    res.status(200).json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Make sure user owns review or is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await review.remove();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
exports.getMyReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Review.countDocuments({ user: req.user.id });
    
    const reviews = await Review.find({ user: req.user.id })
      .populate('product', 'name images price')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      reviews
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
exports.markReviewHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Increment helpful votes
    review.helpfulVotes += 1;
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      helpfulVotes: review.helpfulVotes
    });
  } catch (error) {
    console.error('Mark review helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Admin Controllers

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews
// @access  Private/Admin
exports.getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};

    // Filter by approval status
    if (req.query.isApproved !== undefined) {
      query.isApproved = req.query.isApproved === 'true';
    }

    // Filter by rating
    if (req.query.rating) {
      query.rating = parseInt(req.query.rating);
    }

    // Filter by verified purchase
    if (req.query.verifiedPurchase !== undefined) {
      query.verifiedPurchase = req.query.verifiedPurchase === 'true';
    }

    // Search by product name or user name
    if (req.query.search) {
      const products = await Product.find({
        name: { $regex: req.query.search, $options: 'i' }
      }).select('_id');
      
      query.$or = [
        { product: { $in: products.map(p => p._id) } },
        { title: { $regex: req.query.search, $options: 'i' } },
        { comment: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const total = await Review.countDocuments(query);
    
    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name images')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      reviews
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update review approval status (Admin)
// @route   PUT /api/reviews/:id/approve
// @access  Private/Admin
exports.updateReviewApproval = async (req, res) => {
  try {
    const { isApproved } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    ).populate('user', 'name')
     .populate('product', 'name');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Review ${isApproved ? 'approved' : 'disapproved'} successfully`,
      review
    });
  } catch (error) {
    console.error('Update review approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add admin response to review
// @route   PUT /api/reviews/:id/respond
// @access  Private/Admin
exports.addAdminResponse = async (req, res) => {
  try {
    const { message } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        adminResponse: {
          message,
          respondedAt: Date.now(),
          respondedBy: req.user.id
        }
      },
      { new: true }
    ).populate('user', 'name')
     .populate('product', 'name')
     .populate('adminResponse.respondedBy', 'name');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin response added successfully',
      review
    });
  } catch (error) {
    console.error('Add admin response error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};