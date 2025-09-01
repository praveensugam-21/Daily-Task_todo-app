const express = require("express");
const router = express.Router();

const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  logoutAll,
} = require("../controllers/authController");

const { authMiddleware } = require("../middleware/authMiddleware");
const {
  validate,
  sanitizeInput,
} = require("../middleware/validationMiddleware");

// Public routes
router.post("/register", sanitizeInput, validate("register"), register);
router.post("/login", sanitizeInput, validate("login"), login);
router.post("/refresh", sanitizeInput, refreshToken);

// Protected routes
router.use(authMiddleware);

router.get("/me", getMe);
router.put("/profile", sanitizeInput, validate("updateProfile"), updateProfile);
router.put(
  "/change-password",
  sanitizeInput,
  validate("changePassword"),
  changePassword
);
router.post("/logout", sanitizeInput, logout);
router.post("/logout-all", logoutAll);

module.exports = router;
