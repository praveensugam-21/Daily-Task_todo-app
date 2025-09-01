const mongoose = require("mongoose");

/**
 * Project Schema
 *
 * This schema defines the structure for projects in each user's isolated database.
 * Each user will have their own collection of projects in their dedicated database.
 *
 * Key Features:
 * - Rich project metadata
 * - Status tracking
 * - Timestamps for audit trails
 * - Flexible tagging system
 * - Progress tracking
 */

const projectSchema = new mongoose.Schema(
  {
    // Basic project information
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      required: [true, "Project description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    // Project status and progress
    status: {
      type: String,
      enum: ["planning", "active", "on-hold", "completed", "cancelled"],
      default: "planning",
      required: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      validate: {
        validator: function (value) {
          return Number.isInteger(value);
        },
        message: "Progress must be an integer between 0 and 100",
      },
    },

    // Dates
    startDate: {
      type: Date,
      default: Date.now,
    },

    dueDate: {
      type: Date,
      validate: {
        validator: function (value) {
          // Due date should be after start date
          return !value || !this.startDate || value >= this.startDate;
        },
        message: "Due date must be after start date",
      },
    },

    completedDate: {
      type: Date,
      validate: {
        validator: function (value) {
          // Only set completion date if status is completed
          if (value && this.status !== "completed") {
            return false;
          }
          return true;
        },
        message: "Completion date can only be set when status is completed",
      },
    },

    // Metadata
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [30, "Tag cannot exceed 30 characters"],
      },
    ],

    category: {
      type: String,
      trim: true,
      maxlength: [50, "Category cannot exceed 50 characters"],
    },

    // Budget and resources (optional)
    budget: {
      type: Number,
      min: 0,
    },

    currency: {
      type: String,
      default: "USD",
      maxlength: 3,
    },

    // Team members (simple string array for this example)
    teamMembers: [
      {
        type: String,
        trim: true,
        maxlength: [100, "Team member name cannot exceed 100 characters"],
      },
    ],

    // Notes and additional information
    notes: {
      type: String,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
    },

    // Attachments (file references)
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        size: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Activity log
    activityLog: [
      {
        action: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        details: String,
      },
    ],
  },
  {
    // Schema options
    timestamps: true, // Adds createdAt and updatedAt automatically
    versionKey: false, // Disable __v field

    // Transform output when converting to JSON
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
projectSchema.index({ name: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ dueDate: 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ createdAt: -1 });

// Virtual for calculating days until due date
projectSchema.virtual("daysUntilDue").get(function () {
  if (!this.dueDate || this.status === "completed") {
    return null;
  }

  const today = new Date();
  const timeDiff = this.dueDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  return daysDiff;
});

// Virtual for checking if project is overdue
projectSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate || this.status === "completed") {
    return false;
  }

  return new Date() > this.dueDate;
});

// Pre-save middleware to update completion date
projectSchema.pre("save", function (next) {
  // Set completion date when status changes to completed
  if (this.status === "completed" && !this.completedDate) {
    this.completedDate = new Date();
    this.progress = 100;
  }

  // Clear completion date if status is not completed
  if (this.status !== "completed" && this.completedDate) {
    this.completedDate = undefined;
  }

  // Add activity log entry for status changes
  if (this.isModified("status")) {
    this.activityLog.push({
      action: "status_changed",
      details: `Status changed to: ${this.status}`,
      timestamp: new Date(),
    });
  }

  next();
});

// Static methods for common queries
projectSchema.statics.findByStatus = function (status) {
  return this.find({ status });
};

projectSchema.statics.findOverdue = function () {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ["completed", "cancelled"] },
  });
};

projectSchema.statics.findByPriority = function (priority) {
  return this.find({ priority }).sort({ createdAt: -1 });
};

// Instance methods
projectSchema.methods.markCompleted = function () {
  this.status = "completed";
  this.completedDate = new Date();
  this.progress = 100;
  return this.save();
};

projectSchema.methods.addActivityLog = function (action, details) {
  this.activityLog.push({
    action,
    details,
    timestamp: new Date(),
  });
  return this.save();
};

// Export the schema (not the model, since we create models dynamically per user)
module.exports = projectSchema;
