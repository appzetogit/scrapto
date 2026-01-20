# Scrapto Backend API

Professional backend API for Scrapto - A scrap management platform connecting users with scrappers.

## 🚀 Features

- RESTful API architecture
- JWT-based authentication
- Role-based access control (User, Scrapper, Admin)
- Order management system
- Payment integration (Razorpay)
- File upload handling (Cloudinary)
- Email notifications
- Rate limiting and security
- Comprehensive error handling
- Request validation
- Logging system

## 📁 Project Structure

```
backend/
├── config/           # Configuration files
│   ├── database.js   # MongoDB connection
│   └── constants.js  # Application constants
├── controllers/      # Route controllers
│   └── authController.js
├── middleware/       # Custom middleware
│   ├── auth.js       # Authentication middleware
│   ├── errorHandler.js
│   ├── notFound.js
│   ├── rateLimiter.js
│   └── validator.js
├── models/          # Mongoose models
│   ├── User.js
│   └── Order.js
├── routes/          # API routes
│   └── authRoutes.js
├── services/        # External services
│   ├── emailService.js
│   └── paymentService.js
├── utils/           # Utility functions
│   ├── asyncHandler.js
│   ├── generateToken.js
│   ├── logger.js
│   ├── responseHandler.js
│   └── upload.js
├── validators/      # Input validators
│   └── authValidator.js
├── logs/           # Application logs
├── uploads/        # Uploaded files
├── server.js       # Entry point
├── package.json
└── .env.example
```

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your configuration values.

3. **Start the server:**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 📝 Environment Variables

See `.env.example` for all required environment variables:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Razorpay key secret
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `SMTP_HOST` - SMTP server host
- And more...

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/profile` - Update profile (Protected)

### Orders (To be implemented)
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

## 🧪 Testing

```bash
npm test
```

## 📦 Dependencies

### Core
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing

### Security
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting

### Utilities
- **winston** - Logging
- **morgan** - HTTP request logger
- **compression** - Response compression
- **dotenv** - Environment variables

### Services
- **razorpay** - Payment gateway
- **cloudinary** - Image upload
- **nodemailer** - Email service
- **multer** - File upload

## 🔒 Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Password hashing with bcrypt
- JWT token authentication
- Input validation
- Error handling

## 📝 Code Style

- ES6+ JavaScript
- Async/await for asynchronous operations
- Consistent error handling
- Standardized API responses

## 🤝 Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Write clear comments
5. Follow RESTful API conventions

## 📄 License

ISC

