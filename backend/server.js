import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { connectDB } from "./config/database.js";
import { configureCloudinary } from "./config/cloudinary.js";
import { validateEnv } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import logger from "./utils/logger.js";
import { handleRazorpayWebhook } from "./controllers/paymentController.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import kycRoutes from "./routes/kycRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import earningsRoutes from "./routes/earningsRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import scrapperRoutes from "./routes/scrapperRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import translationRoutes from "./routes/translateRoutes.js";
import { initializeSocket } from "./services/socketService.js";

// Validate environment variables
try {
  validateEnv();
} catch (error) {
  logger.error("Environment validation failed:", error.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 7000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow any localhost origin in development
      if (
        process.env.NODE_ENV !== "production" &&
        origin.includes("localhost")
      ) {
        return callback(null, true);
      }

      // Check against allowed origins
      const allowedOrigins = (
        process.env.FRONTEND_URL || "http://localhost:5173"
      ).split(",");
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Razorpay webhook (raw body required for signature validation)
app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    req.rawBody = req.body;
    try {
      req.body = JSON.parse(req.rawBody.toString());
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid webhook payload" });
    }
    next();
  },
  handleRazorpayWebhook
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Rate limiting
app.use(rateLimiter);

// Serve static files from uploads directory (fallback for missing Cloudinary)
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API documentation endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Scrapto API Server",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      api: "/api/v1",
      documentation: "/api/v1/docs",
    },
  });
});

// Test endpoint for Socket.io (simplified)
if (process.env.NODE_ENV === "development") {
  app.get("/test-socket", (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head><title>Socket.io Test</title></head>
<body>
  <h1>Socket.io Connection Test</h1>
  <div id="status">Connecting...</div>
  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    socket.on('connect', () => {
      document.getElementById('status').innerHTML = 'Connected! Socket ID: ' + socket.id;
    });
  </script>
</body>
</html>`);
  });
}

// Version 1 API routes
const v1Router = express.Router();
v1Router.use("/auth", authRoutes);
v1Router.use("/orders", orderRoutes);
v1Router.use("/payments", paymentRoutes);
v1Router.use("/uploads", uploadRoutes);
v1Router.use("/kyc", kycRoutes);
v1Router.use("/subscriptions", subscriptionRoutes);
v1Router.use("/admin", adminRoutes);
v1Router.use("/scrapper/earnings", earningsRoutes);
v1Router.use("/chats", chatRoutes);
v1Router.use("/reviews", reviewRoutes);
v1Router.use("/scrappers", scrapperRoutes);
v1Router.use("/banners", bannerRoutes);
v1Router.use("/public", publicRoutes);
v1Router.use("/support", supportRoutes);
v1Router.use("/admin/referral-system", referralRoutes);
v1Router.use("/wallet", walletRoutes);
v1Router.use("/translate", translationRoutes);

// Mount versioned routes
app.use("/api/v1", v1Router);

// Legacy routes (for backward compatibility - remove in future)
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/scrapper/earnings", earningsRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/scrappers", scrapperRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/admin/referral-system", referralRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/translate", translationRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Connect to database, Redis, and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info("✅ Database connected successfully");

    // Configure Cloudinary (optional - only if credentials provided)
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        configureCloudinary();
        logger.info("✅ Cloudinary configured successfully");
      } catch (cloudinaryError) {
        logger.warn(
          "⚠️  Cloudinary configuration failed:",
          cloudinaryError.message
        );
      }
    } else {
      logger.warn(
        "⚠️  Cloudinary credentials not provided, file uploads will use local storage"
      );
    }

    const server = app.listen(PORT, () => {
      logger.info(
        `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || "development"
        } mode`
      );
      logger.info(`📡 API available at http://localhost:${PORT}/api/v1`);
    });

    // Initialize Socket.io
    initializeSocket(server);
    logger.info("✅ Socket.io initialized");
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
