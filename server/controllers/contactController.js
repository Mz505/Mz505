const Contact = require('../models/Contact');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

// @desc    Create contact message
// @route   POST /api/contact
// @access  Public
exports.createContact = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      subject,
      message,
      category,
      priority,
      attachments
    } = req.body;

    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
      category: category || 'general_inquiry',
      priority: priority || 'medium',
      attachments: attachments || []
    });

    // Send confirmation email to user
    try {
      await sendEmail({
        email: contact.email,
        subject: 'Contact Form Submitted - We\'ll be in touch soon!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Thank you for contacting us!</h2>
            <p>Dear ${contact.name},</p>
            <p>We have received your message and will respond within 24-48 hours.</p>
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0;">
              <h3>Your Message Details:</h3>
              <p><strong>Subject:</strong> ${contact.subject}</p>
              <p><strong>Category:</strong> ${contact.category}</p>
              <p><strong>Message:</strong></p>
              <p>${contact.message}</p>
            </div>
            <p>Best regards,<br>Customer Support Team</p>
          </div>
        `
      });
    } catch (error) {
      console.log('Error sending contact confirmation email:', error.message);
    }

    // Send notification email to admin
    try {
      await sendEmail({
        email: process.env.EMAIL_FROM,
        subject: `New Contact Form Submission - ${contact.category}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Contact Form Submission</h2>
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0;">
              <p><strong>Name:</strong> ${contact.name}</p>
              <p><strong>Email:</strong> ${contact.email}</p>
              <p><strong>Phone:</strong> ${contact.phone || 'Not provided'}</p>
              <p><strong>Subject:</strong> ${contact.subject}</p>
              <p><strong>Category:</strong> ${contact.category}</p>
              <p><strong>Priority:</strong> ${contact.priority}</p>
              <p><strong>Message:</strong></p>
              <p>${contact.message}</p>
            </div>
            <p>Please log in to the admin panel to respond.</p>
          </div>
        `
      });
    } catch (error) {
      console.log('Error sending admin notification email:', error.message);
    }

    res.status(201).json({
      success: true,
      message: 'Contact message sent successfully',
      contact
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get contact message by ID
// @route   GET /api/contact/:id
// @access  Private/Admin
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('response.respondedBy', 'name');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    // Mark as read if not already read
    if (!contact.isRead) {
      contact.isRead = true;
      contact.readAt = Date.now();
      await contact.save();
    }

    res.status(200).json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('Get contact by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private/Admin
exports.getContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by priority
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Filter by read status
    if (req.query.isRead !== undefined) {
      query.isRead = req.query.isRead === 'true';
    }

    // Search by name, email, or subject
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { subject: { $regex: req.query.search, $options: 'i' } }
      ];
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

    const total = await Contact.countDocuments(query);
    
    const contacts = await Contact.find(query)
      .populate('assignedTo', 'name')
      .populate('response.respondedBy', 'name')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: contacts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      contacts
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update contact status
// @route   PUT /api/contact/:id/status
// @access  Private/Admin
exports.updateContactStatus = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        status,
        assignedTo: assignedTo || undefined
      },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact status updated successfully',
      contact
    });
  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Respond to contact message
// @route   PUT /api/contact/:id/respond
// @access  Private/Admin
exports.respondToContact = async (req, res) => {
  try {
    const { message, followUpRequired, followUpDate } = req.body;

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        response: {
          message,
          respondedAt: Date.now(),
          respondedBy: req.user.id
        },
        status: 'resolved',
        followUpRequired: followUpRequired || false,
        followUpDate: followUpDate || undefined
      },
      { new: true }
    ).populate('response.respondedBy', 'name');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    // Send response email to user
    try {
      const responseEmail = emailTemplates.contactResponse(contact.name, message);
      await sendEmail({
        email: contact.email,
        subject: responseEmail.subject,
        html: responseEmail.html
      });
    } catch (error) {
      console.log('Error sending contact response email:', error.message);
    }

    res.status(200).json({
      success: true,
      message: 'Response sent successfully',
      contact
    });
  } catch (error) {
    console.error('Respond to contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete contact message
// @route   DELETE /api/contact/:id
// @access  Private/Admin
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    await contact.remove();

    res.status(200).json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get contact statistics
// @route   GET /api/contact/stats
// @access  Private/Admin
exports.getContactStats = async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const openContacts = await Contact.countDocuments({ status: 'open' });
    const inProgressContacts = await Contact.countDocuments({ status: 'in_progress' });
    const resolvedContacts = await Contact.countDocuments({ status: 'resolved' });
    const unreadContacts = await Contact.countDocuments({ isRead: false });

    // Category breakdown
    const categoryStats = await Contact.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Priority breakdown
    const priorityStats = await Contact.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent contacts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentContacts = await Contact.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Average response time
    const avgResponseTime = await Contact.aggregate([
      {
        $match: {
          'response.respondedAt': { $exists: true }
        }
      },
      {
        $project: {
          responseTime: {
            $subtract: ['$response.respondedAt', '$createdAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalContacts,
        open: openContacts,
        inProgress: inProgressContacts,
        resolved: resolvedContacts,
        unread: unreadContacts,
        recent: recentContacts,
        averageResponseTime: avgResponseTime[0]?.avgResponseTime || 0,
        categoryBreakdown: categoryStats,
        priorityBreakdown: priorityStats
      }
    });
  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};