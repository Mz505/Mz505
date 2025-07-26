const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = Product.find({ isActive: true });

    // Search
    if (req.query.keyword) {
      query = query.find({
        $text: { $search: req.query.keyword }
      });
    }

    // Category filter
    if (req.query.category) {
      query = query.find({ category: req.query.category });
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      const priceFilter = {};
      if (req.query.minPrice) priceFilter.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) priceFilter.$lte = Number(req.query.maxPrice);
      query = query.find({ price: priceFilter });
    }

    // Rating filter
    if (req.query.minRating) {
      query = query.find({ ratings: { $gte: Number(req.query.minRating) } });
    }

    // Brand filter
    if (req.query.brand) {
      query = query.find({ brand: req.query.brand });
    }

    // In stock filter
    if (req.query.inStock === 'true') {
      query = query.find({ stock: { $gt: 0 } });
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Get total count for pagination
    const total = await Product.countDocuments(query.getQuery());

    // Execute query with pagination
    const products = await query
      .skip(startIndex)
      .limit(limit)
      .populate('seller', 'name')
      .exec();

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email')
      .populate({
        path: 'reviews',
        populate: {
          path: 'user',
          select: 'name avatar'
        }
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    product.views += 1;
    await product.save();

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin/Seller)
exports.createProduct = async (req, res) => {
  try {
    // Add seller to req.body
    req.body.seller = req.user.id;

    // Handle image uploads
    const images = [];
    if (req.body.images) {
      for (let i = 0; i < req.body.images.length; i++) {
        const result = await cloudinary.uploader.upload(req.body.images[i], {
          folder: 'ecommerce/products',
          width: 1000,
          crop: 'scale'
        });

        images.push({
          public_id: result.public_id,
          url: result.secure_url
        });
      }
    }

    req.body.images = images;

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin/Seller)
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Make sure user is product seller or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    // Handle image updates
    if (req.body.images) {
      // Delete old images from cloudinary
      for (let i = 0; i < product.images.length; i++) {
        await cloudinary.uploader.destroy(product.images[i].public_id);
      }

      // Upload new images
      const images = [];
      for (let i = 0; i < req.body.images.length; i++) {
        const result = await cloudinary.uploader.upload(req.body.images[i], {
          folder: 'ecommerce/products',
          width: 1000,
          crop: 'scale'
        });

        images.push({
          public_id: result.public_id,
          url: result.secure_url
        });
      }

      req.body.images = images;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin/Seller)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Make sure user is product seller or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    // Delete images from cloudinary
    for (let i = 0; i < product.images.length; i++) {
      await cloudinary.uploader.destroy(product.images[i].public_id);
    }

    await product.remove();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      isFeatured: true, 
      isActive: true 
    })
    .sort('-ratings')
    .limit(8)
    .populate('seller', 'name');

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get top rated products
// @route   GET /api/products/top-rated
// @access  Public
exports.getTopRatedProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      isActive: true,
      ratings: { $gte: 4 }
    })
    .sort('-ratings -numOfReviews')
    .limit(10)
    .populate('seller', 'name');

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Get top rated products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
exports.getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true
    })
    .sort('-ratings')
    .limit(6)
    .populate('seller', 'name');

    res.status(200).json({
      success: true,
      count: relatedProducts.length,
      products: relatedProducts
    });
  } catch (error) {
    console.error('Get related products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};