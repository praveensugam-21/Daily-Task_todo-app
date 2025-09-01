const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Task title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Task description cannot exceed 1000 characters"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !value || value >= new Date();
        },
        message: "Due date cannot be in the past",
      },
    },
    completedAt: {
      type: Date,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    estimatedTime: {
      type: Number, // in minutes
      min: [0, "Estimated time cannot be negative"],
    },
    actualTime: {
      type: Number, // in minutes
      min: [0, "Actual time cannot be negative"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
    },
    recurring: {
      type: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
        required: function () {
          return this.isRecurring;
        },
      },
      interval: {
        type: Number,
        min: [1, "Interval must be at least 1"],
        default: 1,
      },
      endDate: {
        type: Date,
        validate: {
          validator: function (value) {
            return !value || value > new Date();
          },
          message: "Recurring end date cannot be in the past",
        },
      },
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    subtasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    attachments: [
      {
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    history: [
      {
        action: {
          type: String,
          enum: ["created", "updated", "completed", "cancelled", "restored"],
          required: true,
        },
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for task age
taskSchema.virtual("age").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for overdue status
taskSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate || this.status === "completed") return false;
  return new Date() > this.dueDate;
});

// Virtual for completion rate (for recurring tasks)
taskSchema.virtual("completionRate").get(function () {
  if (!this.isRecurring || !this.recurring) return null;
  // This would need to be calculated based on actual recurring instances
  return 0;
});

// Indexes for better query performance
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, completedAt: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ user: 1, tags: 1 });

// Compound indexes for common queries
taskSchema.index({ user: 1, status: 1, dueDate: 1 });
taskSchema.index({ user: 1, completedAt: 1, status: 1 });

// Pre-save middleware to add history
taskSchema.pre("save", function (next) {
  if (this.isNew) {
    this.history.push({
      action: "created",
      timestamp: new Date(),
    });
  } else if (this.isModified()) {
    const changes = this.modifiedPaths();
    changes.forEach((field) => {
      if (field !== "history" && field !== "updatedAt") {
        this.history.push({
          action: "updated",
          field,
          oldValue: this._original[field],
          newValue: this[field],
          timestamp: new Date(),
        });
      }
    });
  }
  next();
});

// Pre-save middleware to handle completion
taskSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "completed" &&
    !this.completedAt
  ) {
    this.completedAt = new Date();
    this.history.push({
      action: "completed",
      timestamp: new Date(),
    });
  } else if (
    this.isModified("status") &&
    this.status !== "completed" &&
    this.completedAt
  ) {
    this.completedAt = null;
    this.history.push({
      action: "restored",
      timestamp: new Date(),
    });
  }
  next();
});

// Static method to get today's tasks
taskSchema.statics.getTodayTasks = function (userId) {
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999
  );

  return this.find({
    user: userId,
    $or: [
      { createdAt: { $gte: startOfDay, $lte: endOfDay } },
      { dueDate: { $gte: startOfDay, $lte: endOfDay } },
    ],
  }).sort({ priority: -1, createdAt: 1 });
};

// Static method to get completed tasks for yesterday
taskSchema.statics.getYesterdayCompleted = function (userId) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfDay = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate()
  );
  const endOfDay = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate(),
    23,
    59,
    59,
    999
  );

  return this.find({
    user: userId,
    status: "completed",
    completedAt: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ completedAt: -1 });
};

// Static method to get task history
taskSchema.statics.getTaskHistory = function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    user: userId,
    createdAt: { $gte: startDate },
  }).sort({ createdAt: -1 });
};

// Instance method to mark as complete
taskSchema.methods.markComplete = function () {
  this.status = "completed";
  this.completedAt = new Date();
  return this.save();
};

// Instance method to restore task
taskSchema.methods.restore = function () {
  this.status = "pending";
  this.completedAt = null;
  return this.save();
};

// Instance method to add subtask
taskSchema.methods.addSubtask = function (subtaskId) {
  this.subtasks.push(subtaskId);
  return this.save();
};

// Instance method to remove subtask
taskSchema.methods.removeSubtask = function (subtaskId) {
  this.subtasks = this.subtasks.filter(
    (id) => id.toString() !== subtaskId.toString()
  );
  return this.save();
};

module.exports = mongoose.model("Task", taskSchema);
