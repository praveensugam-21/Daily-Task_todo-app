const express = require("express");
const router = express.Router();

const {
  getMotivationalSummary,
  getWeeklySummary,
  getProductivityInsights,
} = require("../controllers/summaryController");

const { authMiddleware } = require("../middleware/authMiddleware");
const { validateQuery } = require("../middleware/validationMiddleware");

// All routes require authentication
router.use(authMiddleware);

// Get motivational summary (yesterday's completed tasks with AI-generated message)
router.get("/", getMotivationalSummary);

// Get weekly summary
router.get("/weekly", getWeeklySummary);

// Get productivity insights
router.get("/insights", validateQuery, getProductivityInsights);

module.exports = router;
