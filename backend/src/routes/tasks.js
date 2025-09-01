const express = require("express");
const router = express.Router();

const {
  getTodayTasks,
  getTasks,
  getTask,
  createTask,
  updateTask,
  completeTask,
  restoreTask,
  deleteTask,
  getTaskHistory,
  getTaskStats,
  bulkUpdateTasks,
  bulkDeleteTasks,
} = require("../controllers/taskController");

const { authMiddleware } = require("../middleware/authMiddleware");
const {
  validate,
  validateQuery,
  sanitizeInput,
} = require("../middleware/validationMiddleware");

// All routes require authentication
router.use(authMiddleware);

// Today's tasks
router.get("/today", getTodayTasks);

// Task history
router.get("/history", validateQuery, getTaskHistory);

// Task statistics
router.get("/stats", validateQuery, getTaskStats);

// Get all tasks with filtering and pagination
router.get("/", validateQuery, getTasks);

// Get single task
router.get("/:id", getTask);

// Create new task
router.post("/", sanitizeInput, validate("createTask"), createTask);

// Update task
router.put("/:id", sanitizeInput, validate("updateTask"), updateTask);

// Mark task as complete
router.patch("/:id/complete", completeTask);

// Restore task (mark as pending)
router.patch("/:id/restore", restoreTask);

// Delete task
router.delete("/:id", deleteTask);

// Bulk operations
router.patch("/bulk", sanitizeInput, bulkUpdateTasks);
router.delete("/bulk", sanitizeInput, bulkDeleteTasks);

module.exports = router;
