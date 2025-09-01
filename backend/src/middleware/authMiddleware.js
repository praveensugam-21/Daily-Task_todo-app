const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Access denied",
        message: "No token provided or invalid token format",
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        error: "Access denied",
        message: "No token provided",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(401).json({
          error: "Access denied",
          message: "User no longer exists",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          error: "Access denied",
          message: "User account is deactivated",
        });
      }

      // Check if token was issued before user's last password change
      if (decoded.iat < user.passwordChangedAt / 1000) {
        return res.status(401).json({
          error: "Access denied",
          message: "Token is invalid due to password change",
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (jwtError) {
      logger.warn(`JWT verification failed: ${jwtError.message}`, {
        token: token.substring(0, 20) + "...",
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Token expired",
          message: "Your session has expired. Please log in again.",
        });
      }

      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          error: "Invalid token",
          message: "The provided token is invalid.",
        });
      }

      return res.status(401).json({
        error: "Token verification failed",
        message: "Unable to verify your authentication token.",
      });
    }
  } catch (error) {
    logger.error("Auth middleware error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Authentication service temporarily unavailable.",
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);

    if (!token) {
      return next(); // Continue without authentication
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (user && user.isActive) {
        req.user = user;
      }

      next();
    } catch (jwtError) {
      // Log but don't fail the request
      logger.warn(`Optional auth failed: ${jwtError.message}`);
      next();
    }
  } catch (error) {
    logger.error("Optional auth middleware error:", error);
    next(); // Continue without authentication
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Access denied",
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        message: "Insufficient permissions to access this resource",
      });
    }

    next();
  };
};

// Admin-only middleware
const requireAdmin = requireRole(["admin"]);

// User or admin middleware
const requireUserOrAdmin = requireRole(["user", "admin"]);

module.exports = {
  authMiddleware,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireUserOrAdmin,
};
