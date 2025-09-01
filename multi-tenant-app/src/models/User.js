const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

/**
 * User Schema
 *
 * This schema is used in a shared "users" database to manage user accounts
 * and track which isolated databases belong to which users.
 *
 * Note: This is stored in a central database, while each user's projects
 * are stored in their own isolated database.
 */

const userSchema = new mongoose.Schema(
  {
    // Unique user identifier (used for database naming)
    userId: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4().replace(/-/g, ""), // Remove hyphens for cleaner DB names
      immutable: true, // Cannot be changed after creation
    },

    // User credentials (simplified for demo)
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },

    // User profile information
    profile: {
      firstName: {
        type: String,
        trim: true,
        maxlength: [50, "First name cannot exceed 50 characters"],
      },
      lastName: {
        type: String,
        trim: true,
        maxlength: [50, "Last name cannot exceed 50 characters"],
      },
      company: {
        type: String,
        trim: true,
        maxlength: [100, "Company name cannot exceed 100 characters"],
      },
      timezone: {
        type: String,
        default: "UTC",
      },
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Database information
    databaseInfo: {
      dbName: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      lastAccessed: {
        type: Date,
        default: Date.now,
      },
      // Statistics
      projectCount: {
        type: Number,
        default: 0,
      },
      storageUsed: {
        type: Number, // in bytes
        default: 0,
      },
    },

    // User preferences
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "light",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: false,
        },
      },
      dateFormat: {
        type: String,
        default: "MM/DD/YYYY",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,

    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ userId: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

// Pre-save middleware to set database name
userSchema.pre("save", function (next) {
  if (this.isNew) {
    const dbPrefix = process.env.DB_PREFIX || "tenant_";
    this.databaseInfo.dbName = `${dbPrefix}${this.userId}`;
  }

  // Update last accessed time
  if (this.isModified() && !this.isNew) {
    this.databaseInfo.lastAccessed = new Date();
  }

  next();
});

// Static methods
userSchema.statics.findByUserId = function (userId) {
  return this.findOne({ userId, isActive: true });
};

userSchema.statics.findByUsername = function (username) {
  return this.findOne({ username, isActive: true });
};

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Instance methods
userSchema.methods.updateLastAccessed = function () {
  this.databaseInfo.lastAccessed = new Date();
  return this.save();
};

userSchema.methods.updateStats = function (projectCount, storageUsed) {
  this.databaseInfo.projectCount =
    projectCount || this.databaseInfo.projectCount;
  this.databaseInfo.storageUsed = storageUsed || this.databaseInfo.storageUsed;
  return this.save();
};

userSchema.methods.deactivate = function () {
  this.isActive = false;
  return this.save();
};

// Export the schema
module.exports = userSchema;
