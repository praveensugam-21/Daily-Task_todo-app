const express = require("express");
const UserController = require("../controllers/userController");

const router = express.Router();

/**
 * User Routes
 *
 * Handles user management operations including signup, login, and profile management.
 * These routes manage users in the central database while preparing their isolated databases.
 */

/**
 * @route   POST /api/users/signup
 * @desc    Create a new user account
 * @access  Public
 * @body    { username, email, firstName, lastName, company }
 */
router.post("/signup", UserController.signup);

/**
 * @route   POST /api/users/login
 * @desc    Simulate user login
 * @access  Public
 * @body    { username, email }
 */
router.post("/login", UserController.login);

/**
 * @route   GET /api/users
 * @desc    Get all users (admin function)
 * @access  Public (in production, this should be admin-only)
 * @query   page, limit
 */
router.get("/", UserController.getAllUsers);

/**
 * @route   GET /api/users/profile/:userId
 * @desc    Get user profile information
 * @access  Public (in production, should verify user owns this profile)
 */
router.get("/profile/:userId", UserController.getProfile);

/**
 * @route   PUT /api/users/profile/:userId
 * @desc    Update user profile
 * @access  Public (in production, should verify user owns this profile)
 * @body    { profile: { firstName, lastName, company }, preferences: { theme, notifications } }
 */
router.put("/profile/:userId", UserController.updateProfile);

/**
 * @route   DELETE /api/users/:userId
 * @desc    Delete user account (soft delete)
 * @access  Public (in production, should verify user owns this account or admin)
 */
router.delete("/:userId", UserController.deleteUser);

module.exports = router;
