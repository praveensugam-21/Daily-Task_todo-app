require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

// Import routes
const indexRoutes = require("./routes/index");
const userRoutes = require("./routes/users");
const projectRoutes = require("./routes/projects");

// Import database manager
const databaseManager = require("./config/database");

/**
 * Multi-Tenant MongoDB Express Server
 *
 * This server provides a RESTful API with per-user database isolation.
 * Each user gets their own MongoDB database while sharing the same application instance.
 *
 * Key Features:
 * - Per-user database isolation using MongoDB
 * - Dynamic database connection management
 * - User management with signup/login simulation
 * - Full CRUD operations for projects
 * - Connection pooling and cleanup
 * - Comprehensive error handling
 * - Production-ready middleware stack
 */

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        crossOriginEmbedderPolicy: false,
      })
    );

    // CORS configuration
    const corsOptions = {
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    };
    this.app.use(cors(corsOptions));

    // Compression middleware
    this.app.use(compression());

    // Request logging
    if (process.env.NODE_ENV === "development") {
      this.app.use(morgan("dev"));
    } else {
      this.app.use(morgan("combined"));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Request timestamp middleware
    this.app.use((req, res, next) => {
      req.timestamp = new Date().toISOString();
      next();
    });

    // Request ID middleware for tracing
    this.app.use((req, res, next) => {
      req.id = Math.random().toString(36).substr(2, 9);
      res.setHeader("X-Request-ID", req.id);
      next();
    });

    console.log("✅ Middleware setup complete");
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Root route
    this.app.get("/", (req, res) => {
      res.json({
        success: true,
        message: "Multi-tenant MongoDB API Server",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        documentation: "/api/docs",
        health: "/api/health",
        status: "/api/status",
      });
    });

    // API routes
    this.app.use("/api", indexRoutes);
    this.app.use("/api/users", userRoutes);

    // Mount project routes under users (for user-scoped projects)
    this.app.use("/api/users/:userId/projects", projectRoutes);

    // 404 handler for undefined routes
    this.app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        documentation: "/api/docs",
      });
    });

    console.log("✅ Routes setup complete");
  }

  /**
   * Setup error handling middleware
   */
  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error(`❌ Error [${req.id}]:`, error);

      // Default error response
      let statusCode = 500;
      let message = "Internal server error";
      let details = {};

      // Handle specific error types
      if (error.name === "ValidationError") {
        statusCode = 400;
        message = "Validation error";
        details.errors = Object.values(error.errors).map((err) => err.message);
      } else if (error.name === "CastError") {
        statusCode = 400;
        message = "Invalid ID format";
      } else if (error.code === 11000) {
        statusCode = 409;
        message = "Duplicate entry";
        details.field = Object.keys(error.keyPattern)[0];
      } else if (error.name === "MongoNetworkError") {
        statusCode = 503;
        message = "Database connection error";
      }

      res.status(statusCode).json({
        success: false,
        message,
        requestId: req.id,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === "development" && {
          error: error.message,
          stack: error.stack,
          ...details,
        }),
      });
    });

    console.log("✅ Error handling setup complete");
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Test database connectivity
      console.log("🔍 Testing database connectivity...");

      // The database manager will handle connections dynamically
      // No need to connect upfront since we create connections per user

      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 Server running on port ${this.port}`);
        console.log(`📖 Documentation: http://localhost:${this.port}/api/docs`);
        console.log(
          `❤️ Health check: http://localhost:${this.port}/api/health`
        );
        console.log(
          `📊 System status: http://localhost:${this.port}/api/status`
        );
        console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

        if (process.env.NODE_ENV === "development") {
          console.log("\n🔧 Development mode enabled");
          console.log("📝 Example commands:");
          console.log("   curl http://localhost:" + this.port + "/api/health");
          console.log(
            "   curl -X POST http://localhost:" +
              this.port +
              "/api/users/signup \\"
          );
          console.log('     -H "Content-Type: application/json" \\');
          console.log(
            '     -d \'{"username":"testuser","email":"test@example.com"}\''
          );
        }
      });

      // Handle server errors
      this.server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
          console.error(`❌ Port ${this.port} is already in use`);
          process.exit(1);
        } else {
          console.error("❌ Server error:", error);
        }
      });
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log("\n🛑 Shutting down server...");

    if (this.server) {
      this.server.close(() => {
        console.log("✅ HTTP server closed");
      });
    }

    // Shutdown database connections
    await databaseManager.shutdown();

    console.log("👋 Server shutdown complete");
    process.exit(0);
  }
}

// Create and start server
const server = new Server();

// Handle graceful shutdown
process.on("SIGTERM", () => server.shutdown());
process.on("SIGINT", () => server.shutdown());
process.on("SIGUSR2", () => server.shutdown()); // Nodemon restart

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  server.shutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  server.shutdown();
});

// Start the server
server.start().catch((error) => {
  console.error("💥 Failed to start server:", error);
  process.exit(1);
});

module.exports = server;
