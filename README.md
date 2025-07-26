# Full-Stack E-Commerce Platform (MERN Stack)

A feature-rich, scalable e-commerce platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js). This application provides complete e-commerce functionality from product browsing to checkout, user authentication, admin dashboard, and customer support.

## 🚀 Features

### 🛍️ Customer Features
- **User Authentication**: Registration, login, logout, password reset
- **Product Browsing**: Search, filter, sort, and pagination
- **Product Details**: Detailed product pages with image zoom, reviews, and ratings
- **Shopping Cart**: Add/remove items, quantity management, localStorage persistence
- **Wishlist**: Save favorite products for later purchase
- **Checkout Process**: Secure payment processing with Stripe
- **Order Management**: Order history, tracking, and status updates
- **User Profile**: Manage personal information, addresses, and preferences
- **Product Reviews**: Leave reviews and ratings for purchased products
- **Contact Support**: Contact form for customer inquiries

### 👨‍💼 Admin Features
- **Dashboard**: Overview of sales, orders, and analytics
- **Product Management**: CRUD operations for products, categories, and inventory
- **Order Management**: Update order status, tracking information
- **User Management**: View and manage user accounts
- **Review Moderation**: Approve, respond to, and manage product reviews
- **Contact Management**: Handle customer support requests
- **Analytics**: Sales reports, customer insights, and performance metrics

### 🔧 Technical Features
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Real-time Updates**: Socket.io for live notifications
- **Image Management**: Cloudinary integration for image storage
- **Payment Processing**: Stripe integration for secure payments
- **Email Services**: Automated email notifications
- **Search & Filtering**: Advanced product search and filtering
- **Security**: JWT authentication, password hashing, rate limiting
- **Performance**: Optimized queries, pagination, caching

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI library
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **React Router DOM** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Stripe.js** - Payment processing

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **Cloudinary** - Image storage
- **Stripe** - Payment gateway
- **Nodemailer** - Email service
- **Socket.io** - Real-time communication

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── features/       # Feature-based modules
│   │   │   ├── auth/       # Authentication
│   │   │   ├── products/   # Product management
│   │   │   ├── cart/       # Shopping cart
│   │   │   ├── orders/     # Order management
│   │   │   └── admin/      # Admin dashboard
│   │   ├── pages/          # Page components
│   │   ├── redux/          # Redux store and slices
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript types
│   ├── tailwind.config.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── models/            # Mongoose models
│   ├── routes/            # Express routes
│   ├── middlewares/       # Custom middlewares
│   ├── utils/             # Utility functions
│   ├── config/            # Configuration files
│   ├── server.js          # Server entry point
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-mern
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   
   Create `.env` file in the server directory:
   ```env
   NODE_ENV=development
   PORT=5000
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   
   # JWT
   JWT_SECRET=your_jwt_secret_key_here_make_it_very_long_and_secure
   JWT_EXPIRE=30d
   
   # Client URL
   CLIENT_URL=http://localhost:3000
   
   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Stripe (for payments)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   
   # Email configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   EMAIL_FROM=your_email@gmail.com
   ```

5. **Start the development servers**
   
   Terminal 1 (Backend):
   ```bash
   cd server
   npm run dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd client
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password
- `POST /api/auth/forgotpassword` - Forgot password
- `PUT /api/auth/resetpassword/:token` - Reset password

### Products
- `GET /api/products` - Get all products (with pagination, search, filter)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/top-rated` - Get top-rated products

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/myorders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/pay` - Process payment
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders` - Get all orders (Admin)
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/addresses` - Add address
- `PUT /api/users/addresses/:id` - Update address
- `DELETE /api/users/addresses/:id` - Delete address
- `GET /api/users/wishlist` - Get wishlist
- `POST /api/users/wishlist/:productId` - Add to wishlist
- `DELETE /api/users/wishlist/:productId` - Remove from wishlist

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/reviews/my-reviews` - Get user reviews

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get all contacts (Admin)
- `GET /api/contact/:id` - Get contact by ID (Admin)
- `PUT /api/contact/:id/respond` - Respond to contact (Admin)

## 🎨 Design System

### Color Palette
- **Primary**: Blue shades for primary actions and branding
- **Secondary**: Gray shades for secondary elements
- **Success**: Green for positive actions
- **Warning**: Yellow for warnings
- **Error**: Red for errors

### Typography
- **Font Family**: Inter (imported from Google Fonts)
- **Font Weights**: 300, 400, 500, 600, 700, 800

### Components
- **Buttons**: Rounded with hover effects and shadows
- **Cards**: Soft shadows with rounded corners
- **Inputs**: Clean borders with focus states
- **Navigation**: Sticky header with dropdown menus

## 🔐 Security Features

- **Authentication**: JWT tokens with expiration
- **Password Security**: Bcrypt hashing
- **Rate Limiting**: Prevent abuse and DoS attacks
- **CORS**: Configured for secure cross-origin requests
- **Helmet**: Security headers
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Mongoose ODM protection

## 📱 Responsive Design

- **Mobile First**: Designed for mobile devices first
- **Breakpoints**: Responsive across all screen sizes
- **Touch Friendly**: Optimized for touch interactions
- **Performance**: Optimized images and lazy loading

## 🚀 Deployment

### Frontend (Netlify/Vercel)
1. Build the project: `npm run build`
2. Deploy the `build` folder to your hosting service

### Backend (Heroku/Railway/Render)
1. Set environment variables
2. Deploy the server code
3. Ensure MongoDB connection is configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@example.com or create an issue in the repository.

## 🙏 Acknowledgments

- React community for excellent documentation
- TailwindCSS for the utility-first approach
- Stripe for secure payment processing
- MongoDB for flexible data storage
- All open-source contributors who made this possible

---

**Happy Coding!** 🎉
