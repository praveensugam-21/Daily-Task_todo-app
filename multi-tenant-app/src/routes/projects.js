const express = require("express");
const ProjectController = require("../controllers/projectController");

const router = express.Router({ mergeParams: true }); // Enable access to parent route params

/**
 * Project Routes
 *
 * All routes are scoped to a specific user via the userId parameter.
 * Each user's projects are completely isolated in their own database.
 *
 * Base path: /api/users/:userId/projects
 */

/**
 * @route   GET /api/users/:userId/projects/stats
 * @desc    Get project statistics for a user
 * @access  Public (in production, should verify user access)
 */
router.get("/stats", ProjectController.getProjectStats);

/**
 * @route   PATCH /api/users/:userId/projects/bulk
 * @desc    Bulk update multiple projects
 * @access  Public (in production, should verify user access)
 * @body    { projectIds: [string], updates: object }
 */
router.patch("/bulk", ProjectController.bulkUpdateProjects);

/**
 * @route   POST /api/users/:userId/projects
 * @desc    Create a new project for the user
 * @access  Public (in production, should verify user access)
 * @body    { name, description, status?, priority?, dueDate?, tags?, ... }
 */
router.post("/", ProjectController.createProject);

/**
 * @route   GET /api/users/:userId/projects
 * @desc    Get all projects for a user with filtering and pagination
 * @access  Public (in production, should verify user access)
 * @query   page, limit, status, priority, search, sortBy, sortOrder
 */
router.get("/", ProjectController.getProjects);

/**
 * @route   GET /api/users/:userId/projects/:projectId
 * @desc    Get a specific project
 * @access  Public (in production, should verify user access)
 */
router.get("/:projectId", ProjectController.getProject);

/**
 * @route   PUT /api/users/:userId/projects/:projectId
 * @desc    Update a project
 * @access  Public (in production, should verify user access)
 * @body    { name?, description?, status?, priority?, progress?, ... }
 */
router.put("/:projectId", ProjectController.updateProject);

/**
 * @route   PATCH /api/users/:userId/projects/:projectId/complete
 * @desc    Mark a project as completed
 * @access  Public (in production, should verify user access)
 */
router.patch("/:projectId/complete", ProjectController.completeProject);

/**
 * @route   DELETE /api/users/:userId/projects/:projectId
 * @desc    Delete a project
 * @access  Public (in production, should verify user access)
 */
router.delete("/:projectId", ProjectController.deleteProject);

module.exports = router;
