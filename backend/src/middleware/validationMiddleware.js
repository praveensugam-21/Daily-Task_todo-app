const Joi = require("joi");
const logger = require("../utils/logger");

// Validation schemas
const schemas = {
  // User registration
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      "string.alphanum": "Username must contain only alphanumeric characters",
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username cannot exceed 30 characters",
      "any.required": "Username is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string()
      .min(6)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        "string.min": "Password must be at least 6 characters long",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        "any.required": "Password is required",
      }),
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
  }),

  // User login
  login: Joi.object({
    identifier: Joi.string().required().messages({
      "any.required": "Email or username is required",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  }),

  // Task creation
  createTask: Joi.object({
    title: Joi.string().trim().min(1).max(200).required().messages({
      "string.empty": "Task title cannot be empty",
      "string.max": "Task title cannot exceed 200 characters",
      "any.required": "Task title is required",
    }),
    description: Joi.string().trim().max(1000).optional().messages({
      "string.max": "Task description cannot exceed 1000 characters",
    }),
    priority: Joi.string()
      .valid("low", "medium", "high", "urgent")
      .default("medium")
      .messages({
        "any.only": "Priority must be one of: low, medium, high, urgent",
      }),
    dueDate: Joi.date().min("now").optional().messages({
      "date.min": "Due date cannot be in the past",
    }),
    tags: Joi.array()
      .items(Joi.string().trim().max(50))
      .max(10)
      .optional()
      .messages({
        "array.max": "Cannot have more than 10 tags",
      }),
    estimatedTime: Joi.number().min(0).optional().messages({
      "number.min": "Estimated time cannot be negative",
    }),
    notes: Joi.string().trim().max(2000).optional().messages({
      "string.max": "Notes cannot exceed 2000 characters",
    }),
    isRecurring: Joi.boolean().default(false),
    recurring: Joi.object({
      type: Joi.string()
        .valid("daily", "weekly", "monthly", "yearly")
        .when("isRecurring", {
          is: true,
          then: Joi.required(),
          otherwise: Joi.forbidden(),
        }),
      interval: Joi.number().min(1).default(1),
      endDate: Joi.date().min("now").optional(),
    }).when("isRecurring", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  }),

  // Task update
  updateTask: Joi.object({
    title: Joi.string().trim().min(1).max(200).optional().messages({
      "string.empty": "Task title cannot be empty",
      "string.max": "Task title cannot exceed 200 characters",
    }),
    description: Joi.string().trim().max(1000).optional().messages({
      "string.max": "Task description cannot exceed 1000 characters",
    }),
    priority: Joi.string()
      .valid("low", "medium", "high", "urgent")
      .optional()
      .messages({
        "any.only": "Priority must be one of: low, medium, high, urgent",
      }),
    status: Joi.string()
      .valid("pending", "in_progress", "completed", "cancelled")
      .optional()
      .messages({
        "any.only":
          "Status must be one of: pending, in_progress, completed, cancelled",
      }),
    dueDate: Joi.date().min("now").optional().messages({
      "date.min": "Due date cannot be in the past",
    }),
    tags: Joi.array()
      .items(Joi.string().trim().max(50))
      .max(10)
      .optional()
      .messages({
        "array.max": "Cannot have more than 10 tags",
      }),
    estimatedTime: Joi.number().min(0).optional().messages({
      "number.min": "Estimated time cannot be negative",
    }),
    actualTime: Joi.number().min(0).optional().messages({
      "number.min": "Actual time cannot be negative",
    }),
    notes: Joi.string().trim().max(2000).optional().messages({
      "string.max": "Notes cannot exceed 2000 characters",
    }),
  }),

  // Password change
  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      "any.required": "Current password is required",
    }),
    newPassword: Joi.string()
      .min(6)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        "string.min": "New password must be at least 6 characters long",
        "string.pattern.base":
          "New password must contain at least one uppercase letter, one lowercase letter, and one number",
        "any.required": "New password is required",
      }),
  }),

  // User profile update
  updateProfile: Joi.object({
    firstName: Joi.string().trim().max(50).optional().messages({
      "string.max": "First name cannot exceed 50 characters",
    }),
    lastName: Joi.string().trim().max(50).optional().messages({
      "string.max": "Last name cannot exceed 50 characters",
    }),
    preferences: Joi.object({
      theme: Joi.string().valid("light", "dark", "auto").optional(),
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        push: Joi.boolean().optional(),
      }).optional(),
    }).optional(),
  }),

  // Pagination and filtering
  queryParams: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      "number.base": "Page must be a number",
      "number.integer": "Page must be an integer",
      "number.min": "Page must be at least 1",
    }),
    limit: Joi.number().integer().min(1).max(100).default(20).messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100",
    }),
    sortBy: Joi.string()
      .valid("createdAt", "updatedAt", "dueDate", "priority", "status", "title")
      .default("createdAt")
      .messages({
        "any.only":
          "Sort by must be one of: createdAt, updatedAt, dueDate, priority, status, title",
      }),
    sortOrder: Joi.string().valid("asc", "desc").default("desc").messages({
      "any.only": "Sort order must be either asc or desc",
    }),
    status: Joi.string()
      .valid("pending", "in_progress", "completed", "cancelled")
      .optional()
      .messages({
        "any.only":
          "Status must be one of: pending, in_progress, completed, cancelled",
      }),
    priority: Joi.string()
      .valid("low", "medium", "high", "urgent")
      .optional()
      .messages({
        "any.only": "Priority must be one of: low, medium, high, urgent",
      }),
    tags: Joi.string().optional(),
    search: Joi.string().trim().max(100).optional().messages({
      "string.max": "Search term cannot exceed 100 characters",
    }),
  }),
};

// Generic validation middleware
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      logger.error(`Validation schema '${schemaName}' not found`);
      return res.status(500).json({
        error: "Validation error",
        message: "Invalid validation schema",
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      logger.warn("Validation failed", {
        schema: schemaName,
        errors: errorDetails,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      return res.status(400).json({
        error: "Validation failed",
        message: "Please check your input and try again",
        details: errorDetails,
      });
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Query parameters validation middleware
const validateQuery = (req, res, next) => {
  const { error, value } = schemas.queryParams.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false,
  });

  if (error) {
    const errorDetails = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return res.status(400).json({
      error: "Invalid query parameters",
      message: "Please check your query parameters and try again",
      details: errorDetails,
    });
  }

  // Replace query with validated data
  req.query = value;
  next();
};

// Sanitize input to prevent injection attacks
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== "object" || obj === null) return obj;

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        // Remove potentially dangerous characters
        sanitized[key] = value
          .replace(/[<>]/g, "") // Remove < and >
          .trim();
      } else if (typeof value === "object") {
        sanitized[key] = sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }

  if (req.query) {
    req.query = sanitize(req.query);
  }

  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

module.exports = {
  validate,
  validateQuery,
  sanitizeInput,
  schemas,
};
