# Backend Folder Structure

```
backend/
├── config/                    # Configuration files
│   ├── constants.js          # Application constants (roles, statuses, etc.)
│   └── database.js           # MongoDB connection configuration
│
├── controllers/              # Route controllers (business logic)
│   └── authController.js     # Authentication controller
│
├── middleware/               # Custom middleware functions
│   ├── auth.js              # JWT authentication & authorization
│   ├── errorHandler.js      # Global error handler
│   ├── notFound.js          # 404 handler
│   ├── rateLimiter.js       # Rate limiting middleware
│   └── validator.js         # Validation result handler
│
├── models/                   # Mongoose schemas/models
│   ├── User.js              # User model
│   └── Order.js             # Order model
│
├── routes/                   # API route definitions
│   └── authRoutes.js        # Authentication routes
│
├── services/                 # External service integrations
│   ├── emailService.js      # Email sending service (Nodemailer)
│   └── paymentService.js    # Payment service (Razorpay)
│
├── utils/                    # Utility functions
│   ├── asyncHandler.js      # Async error wrapper
│   ├── generateToken.js     # JWT token generation
│   ├── logger.js            # Winston logger configuration
│   ├── responseHandler.js   # Standardized API responses
│   └── upload.js            # File upload configuration (Multer)
│
├── validators/               # Input validation rules
│   └── authValidator.js     # Authentication validators
│
├── logs/                     # Application logs (auto-generated)
│   └── .gitkeep
│
├── uploads/                  # Uploaded files directory
│   └── .gitkeep
│
├── server.js                 # Main application entry point
├── package.json             # Dependencies and scripts
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── README.md                # Project documentation
└── STRUCTURE.md             # This file
```

## Key Features

### Security
- ✅ JWT-based authentication
- ✅ Role-based access control (User, Scrapper, Admin)
- ✅ Password hashing with bcrypt
- ✅ Rate limiting
- ✅ Helmet.js security headers
- ✅ CORS configuration

### Architecture
- ✅ MVC pattern (Models, Views/Controllers, Routes)
- ✅ Separation of concerns
- ✅ Middleware-based architecture
- ✅ Service layer for external integrations
- ✅ Utility functions for reusability

### Error Handling
- ✅ Global error handler
- ✅ Async error wrapper
- ✅ Standardized error responses
- ✅ 404 handler

### Validation
- ✅ Express-validator integration
- ✅ Input validation middleware
- ✅ Custom validation rules

### Logging
- ✅ Winston logger
- ✅ File-based logging
- ✅ Console logging (development)
- ✅ Error logging

### File Upload
- ✅ Multer configuration
- ✅ File type validation
- ✅ File size limits
- ✅ Multiple upload support

## Next Steps

1. **Create additional models:**
   - Payment model
   - Notification model
   - Review/Rating model

2. **Create additional controllers:**
   - OrderController
   - PaymentController
   - NotificationController

3. **Create additional routes:**
   - Order routes
   - Payment routes
   - Admin routes

4. **Add features:**
   - Cloudinary integration for images
   - SMS service integration
   - Real-time notifications (Socket.io)
   - Caching (Redis)

5. **Testing:**
   - Unit tests
   - Integration tests
   - API documentation (Swagger)

