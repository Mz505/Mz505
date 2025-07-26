const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Define email options
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME || 'E-Commerce Store'} <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);

  console.log('Message sent: %s', info.messageId);
  return info;
};

// Email templates
const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to Our E-Commerce Store!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome ${name}!</h2>
        <p>Thank you for joining our e-commerce platform. We're excited to have you as part of our community.</p>
        <p>Start exploring our wide range of products and enjoy shopping with us!</p>
        <div style="margin-top: 30px;">
          <a href="${process.env.CLIENT_URL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start Shopping</a>
        </div>
      </div>
    `
  }),

  orderConfirmation: (order) => ({
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Confirmation</h2>
        <p>Thank you for your order! Here are the details:</p>
        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0;">
          <h3>Order #${order.orderNumber}</h3>
          <p><strong>Total Amount:</strong> $${order.totalPrice}</p>
          <p><strong>Order Status:</strong> ${order.orderStatus}</p>
        </div>
        <p>We'll send you an update when your order ships.</p>
      </div>
    `
  }),

  orderStatusUpdate: (order) => ({
    subject: `Order Update - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Status Update</h2>
        <p>Your order status has been updated:</p>
        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0;">
          <h3>Order #${order.orderNumber}</h3>
          <p><strong>Status:</strong> ${order.orderStatus}</p>
          ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
        </div>
      </div>
    `
  }),

  contactResponse: (name, response) => ({
    subject: 'Response to Your Inquiry',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hello ${name},</h2>
        <p>Thank you for contacting us. Here's our response to your inquiry:</p>
        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0;">
          ${response}
        </div>
        <p>If you have any further questions, please don't hesitate to reach out.</p>
      </div>
    `
  })
};

module.exports = {
  sendEmail,
  emailTemplates
};