const logger = require("../utils/logger");

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
}

// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id || "anonymous",
  });

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${value}. Please use another value.`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token. Please log in again.";
    error = new AppError(message, 401);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Your token has expired. Please log in again.";
    error = new AppError(message, 401);
  }

  // Multer errors (file upload)
  if (err.code === "LIMIT_FILE_SIZE") {
    const message = "File too large. Please upload a smaller file.";
    error = new AppError(message, 400);
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    const message = "Too many files. Please upload fewer files.";
    error = new AppError(message, 400);
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    const message = "Unexpected file field.";
    error = new AppError(message, 400);
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = "Too many requests from this IP, please try again later.";
    error = new AppError(message, 429);
  }

  // Network errors
  if (err.code === "ECONNREFUSED") {
    const message = "Database connection failed. Please try again later.";
    error = new AppError(message, 503);
  }

  if (err.code === "ENOTFOUND") {
    const message = "Service temporarily unavailable. Please try again later.";
    error = new AppError(message, 503);
  }

  // Default error
  if (!error.statusCode) {
    error.statusCode = 500;
    error.message = "Internal server error";
  }

  // Send error response
  const errorResponse = {
    error: true,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  };

  // Add additional context for specific error types
  if (error.statusCode === 400 && err.errors) {
    errorResponse.details = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
      value: val.value,
    }));
  }

  // Set appropriate headers
  res.status(error.statusCode);

  // Send JSON response
  res.json(errorResponse);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Handle unhandled promise rejections
const handleUnhandledRejection = (err) => {
  logger.error("Unhandled Promise Rejection:", err);
  process.exit(1);
};

// Handle uncaught exceptions
const handleUncaughtException = (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFound,
  handleUnhandledRejection,
  handleUncaughtException,
};
