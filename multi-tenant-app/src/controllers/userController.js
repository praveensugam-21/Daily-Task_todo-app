const mongoose = require("mongoose");
const userSchema = require("../models/User");
const databaseManager = require("../config/database");

/**
 * User Controller
 *
 * Handles user management operations including signup and login simulation.
 * Users are stored in a central "users" database while their data is isolated
 * in individual per-user databases.
 */

// Create User model for central user management
// This uses the default mongoose connection for user management
let UserModel;

const initializeUserModel = async () => {
  if (!UserModel) {
    // Connect to central users database
    const centralDbUrl = `${process.env.MONGODB_BASE_URL}/app_users`;

    try {
      // Create or reuse connection to central users database
      const centralConnection = mongoose.createConnection(centralDbUrl, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      centralConnection.on("connected", () => {
        console.log("✅ Connected to central users database");
      });

      centralConnection.on("error", (err) => {
        console.error("❌ Central database connection error:", err);
      });

      UserModel = centralConnection.model("User", userSchema);
    } catch (error) {
      console.error("Failed to initialize user model:", error);
      throw error;
    }
  }
  return UserModel;
};

class UserController {
  /**
   * Simulate user signup
   * Creates a new user account and initializes their isolated database
   *
   * POST /api/users/signup
   */
  static async signup(req, res) {
    try {
      await initializeUserModel();

      const { username, email, firstName, lastName, company } = req.body;

      // Validate required fields
      if (!username || !email) {
        return res.status(400).json({
          success: false,
          message: "Username and email are required",
        });
      }

      // Check if user already exists
      const existingUser = await UserModel.findOne({
        $or: [{ username }, { email: email.toLowerCase() }],
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User with this username or email already exists",
        });
      }

      // Create new user
      const userData = {
        username,
        email: email.toLowerCase(),
        profile: {
          firstName,
          lastName,
          company,
        },
      };

      const user = new UserModel(userData);
      await user.save();

      // Initialize user's isolated database
      const userDb = await databaseManager.getUserDatabase(user.userId);
      console.log(
        `🏗️ Initialized isolated database for user: ${user.username}`
      );

      // Update user's last accessed time
      await user.updateLastAccessed();

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: {
          userId: user.userId,
          username: user.username,
          email: user.email,
          profile: user.profile,
          databaseName: user.databaseInfo.dbName,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);

      if (error.code === 11000) {
        // Duplicate key error
        return res.status(409).json({
          success: false,
          message: "User with this username or email already exists",
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error during signup",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Simulate user login
   * Returns user information and prepares their isolated database connection
   *
   * POST /api/users/login
   */
  static async login(req, res) {
    try {
      await initializeUserModel();

      const { username, email } = req.body;

      if (!username && !email) {
        return res.status(400).json({
          success: false,
          message: "Username or email is required",
        });
      }

      // Find user by username or email
      const query = username ? { username } : { email: email.toLowerCase() };
      const user = await UserModel.findOne({ ...query, isActive: true });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Prepare user's isolated database connection
      const userDb = await databaseManager.getUserDatabase(user.userId);

      // Update user's last accessed time
      await user.updateLastAccessed();

      // Get user's project count (from their isolated database)
      const projectSchema = require("../models/Project");
      const ProjectModel = await databaseManager.getUserModel(
        user.userId,
        "Project",
        projectSchema
      );
      const projectCount = await ProjectModel.countDocuments();

      // Update user stats
      await user.updateStats(projectCount);

      res.json({
        success: true,
        message: "Login successful",
        data: {
          userId: user.userId,
          username: user.username,
          email: user.email,
          profile: user.profile,
          databaseName: user.databaseInfo.dbName,
          stats: {
            projectCount: user.databaseInfo.projectCount,
            lastAccessed: user.databaseInfo.lastAccessed,
            memberSince: user.createdAt,
          },
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during login",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get user profile information
   *
   * GET /api/users/profile/:userId
   */
  static async getProfile(req, res) {
    try {
      await initializeUserModel();

      const { userId } = req.params;

      const user = await UserModel.findByUserId(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: {
          userId: user.userId,
          username: user.username,
          email: user.email,
          profile: user.profile,
          preferences: user.preferences,
          stats: user.databaseInfo,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving user profile",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Update user profile
   *
   * PUT /api/users/profile/:userId
   */
  static async updateProfile(req, res) {
    try {
      await initializeUserModel();

      const { userId } = req.params;
      const updates = req.body;

      // Remove fields that shouldn't be updated
      delete updates.userId;
      delete updates.username;
      delete updates.email;
      delete updates.databaseInfo;
      delete updates.createdAt;
      delete updates.updatedAt;

      const user = await UserModel.findByUserId(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update allowed fields
      Object.keys(updates).forEach((key) => {
        if (key === "profile" || key === "preferences") {
          user[key] = { ...user[key], ...updates[key] };
        }
      });

      await user.save();

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          userId: user.userId,
          username: user.username,
          email: user.email,
          profile: user.profile,
          preferences: user.preferences,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating user profile",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get all users (admin function)
   *
   * GET /api/users
   */
  static async getAllUsers(req, res) {
    try {
      await initializeUserModel();

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const users = await UserModel.find({ isActive: true })
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await UserModel.countDocuments({ isActive: true });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving users",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Delete user account (soft delete)
   *
   * DELETE /api/users/:userId
   */
  static async deleteUser(req, res) {
    try {
      await initializeUserModel();

      const { userId } = req.params;

      const user = await UserModel.findByUserId(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Soft delete - just deactivate the user
      await user.deactivate();

      // Close the user's database connection
      await databaseManager.closeUserConnection(userId);

      res.json({
        success: true,
        message: "User account deactivated successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting user account",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = UserController;
