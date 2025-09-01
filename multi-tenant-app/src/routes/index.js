const express = require("express");
const databaseManager = require("../config/database");

const router = express.Router();

/**
 * Main API Routes
 *
 * Provides health check and system information endpoints
 */

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Multi-tenant MongoDB API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

/**
 * @route   GET /api/status
 * @desc    Get system status and database connection information
 * @access  Public (in production, should be admin-only)
 */
router.get("/status", (req, res) => {
  try {
    const stats = databaseManager.getStats();

    res.json({
      success: true,
      data: {
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform,
        },
        database: {
          totalConnections: stats.totalConnections,
          activeConnections: stats.activeConnections,
          totalUsers: stats.totalUsers,
          config: {
            baseUrl: stats.config.baseUrl.replace(/\/\/.*@/, "//***:***@"), // Hide credentials
            dbPrefix: stats.config.dbPrefix,
            maxConnectionsPerDb: stats.config.maxConnectionsPerDb,
            cleanupIntervalMinutes: stats.config.cleanupIntervalMinutes,
          },
        },
        activeUserDatabases: stats.activeConnections.map((conn) => ({
          userId: conn.userId,
          dbName: conn.dbName,
          status: conn.readyState === 1 ? "connected" : "disconnected",
          lastAccessed: conn.lastAccessed,
          models: conn.models,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving system status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @route   GET /api/docs
 * @desc    API documentation
 * @access  Public
 */
router.get("/docs", (req, res) => {
  res.json({
    success: true,
    message: "Multi-tenant MongoDB API Documentation",
    version: "1.0.0",
    endpoints: {
      users: {
        "POST /api/users/signup": "Create a new user account",
        "POST /api/users/login": "User login simulation",
        "GET /api/users": "Get all users (paginated)",
        "GET /api/users/profile/:userId": "Get user profile",
        "PUT /api/users/profile/:userId": "Update user profile",
        "DELETE /api/users/:userId": "Deactivate user account",
      },
      projects: {
        "POST /api/users/:userId/projects": "Create a new project",
        "GET /api/users/:userId/projects":
          "Get user's projects (filtered/paginated)",
        "GET /api/users/:userId/projects/stats": "Get project statistics",
        "GET /api/users/:userId/projects/:projectId": "Get specific project",
        "PUT /api/users/:userId/projects/:projectId": "Update project",
        "PATCH /api/users/:userId/projects/:projectId/complete":
          "Mark project complete",
        "DELETE /api/users/:userId/projects/:projectId": "Delete project",
        "PATCH /api/users/:userId/projects/bulk": "Bulk update projects",
      },
      system: {
        "GET /api/health": "Health check",
        "GET /api/status": "System status and database info",
        "GET /api/docs": "This documentation",
      },
    },
    features: {
      "Database Isolation": "Each user gets their own MongoDB database",
      "Connection Pooling":
        "Efficient connection management with automatic cleanup",
      "CRUD Operations":
        "Full Create, Read, Update, Delete operations for projects",
      "User Management": "User signup, login, and profile management",
      Statistics: "Project statistics and system monitoring",
      "Error Handling": "Comprehensive error handling and validation",
      Scalability: "Designed to handle multiple users with isolated data",
    },
    examples: {
      signup: {
        method: "POST",
        url: "/api/users/signup",
        body: {
          username: "john_doe",
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          company: "Acme Corp",
        },
      },
      createProject: {
        method: "POST",
        url: "/api/users/{userId}/projects",
        body: {
          name: "Website Redesign",
          description: "Complete overhaul of company website",
          priority: "high",
          dueDate: "2024-12-31",
          tags: ["web", "design", "urgent"],
        },
      },
    },
  });
});

module.exports = router;
