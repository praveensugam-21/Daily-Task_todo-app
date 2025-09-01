const databaseManager = require("../config/database");
const projectSchema = require("../models/Project");

/**
 * Project Controller
 *
 * Handles all CRUD operations for projects within each user's isolated database.
 * Each user's projects are completely isolated from other users' data.
 */

class ProjectController {
  /**
   * Get user's project model
   * Helper method to get the Project model for a specific user's database
   */
  static async getUserProjectModel(userId) {
    return await databaseManager.getUserModel(userId, "Project", projectSchema);
  }

  /**
   * Create a new project
   *
   * POST /api/users/:userId/projects
   */
  static async createProject(req, res) {
    try {
      const { userId } = req.params;
      const projectData = req.body;

      // Validate required fields
      if (!projectData.name || !projectData.description) {
        return res.status(400).json({
          success: false,
          message: "Project name and description are required",
        });
      }

      // Get user's Project model from their isolated database
      const ProjectModel = await ProjectController.getUserProjectModel(userId);

      // Create new project
      const project = new ProjectModel(projectData);
      await project.save();

      console.log(`📝 Created project "${project.name}" for user: ${userId}`);

      res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: project,
      });
    } catch (error) {
      console.error("Create project error:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }

      res.status(500).json({
        success: false,
        message: "Error creating project",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get all projects for a user
   *
   * GET /api/users/:userId/projects
   */
  static async getProjects(req, res) {
    try {
      const { userId } = req.params;
      const {
        page = 1,
        limit = 10,
        status,
        priority,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const ProjectModel = await ProjectController.getUserProjectModel(userId);

      // Build query
      const query = {};

      if (status) {
        query.status = status;
      }

      if (priority) {
        query.priority = priority;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ];
      }

      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Execute query with pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [projects, total] = await Promise.all([
        ProjectModel.find(query).sort(sort).skip(skip).limit(parseInt(limit)),
        ProjectModel.countDocuments(query),
      ]);

      // Get additional statistics
      const stats = await ProjectModel.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const statusCounts = stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          projects,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
          stats: statusCounts,
        },
      });
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving projects",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get a specific project
   *
   * GET /api/users/:userId/projects/:projectId
   */
  static async getProject(req, res) {
    try {
      const { userId, projectId } = req.params;

      const ProjectModel = await ProjectController.getUserProjectModel(userId);

      const project = await ProjectModel.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error("Get project error:", error);

      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error retrieving project",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Update a project
   *
   * PUT /api/users/:userId/projects/:projectId
   */
  static async updateProject(req, res) {
    try {
      const { userId, projectId } = req.params;
      const updates = req.body;

      const ProjectModel = await ProjectController.getUserProjectModel(userId);

      const project = await ProjectModel.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      // Apply updates
      Object.keys(updates).forEach((key) => {
        if (key !== "_id" && key !== "createdAt" && key !== "updatedAt") {
          project[key] = updates[key];
        }
      });

      await project.save();

      console.log(`📝 Updated project "${project.name}" for user: ${userId}`);

      res.json({
        success: true,
        message: "Project updated successfully",
        data: project,
      });
    } catch (error) {
      console.error("Update project error:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }

      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error updating project",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Mark project as completed
   *
   * PATCH /api/users/:userId/projects/:projectId/complete
   */
  static async completeProject(req, res) {
    try {
      const { userId, projectId } = req.params;

      const ProjectModel = await ProjectController.getUserProjectModel(userId);

      const project = await ProjectModel.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      await project.markCompleted();

      console.log(`✅ Completed project "${project.name}" for user: ${userId}`);

      res.json({
        success: true,
        message: "Project marked as completed",
        data: project,
      });
    } catch (error) {
      console.error("Complete project error:", error);
      res.status(500).json({
        success: false,
        message: "Error completing project",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Delete a project
   *
   * DELETE /api/users/:userId/projects/:projectId
   */
  static async deleteProject(req, res) {
    try {
      const { userId, projectId } = req.params;

      const ProjectModel = await ProjectController.getUserProjectModel(userId);

      const project = await ProjectModel.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      await ProjectModel.findByIdAndDelete(projectId);

      console.log(`🗑️ Deleted project "${project.name}" for user: ${userId}`);

      res.json({
        success: true,
        message: "Project deleted successfully",
      });
    } catch (error) {
      console.error("Delete project error:", error);

      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error deleting project",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get project statistics for a user
   *
   * GET /api/users/:userId/projects/stats
   */
  static async getProjectStats(req, res) {
    try {
      const { userId } = req.params;

      const ProjectModel = await ProjectController.getUserProjectModel(userId);

      // Get comprehensive statistics
      const [statusStats, priorityStats, overallStats] = await Promise.all([
        // Status distribution
        ProjectModel.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),

        // Priority distribution
        ProjectModel.aggregate([
          {
            $group: {
              _id: "$priority",
              count: { $sum: 1 },
            },
          },
        ]),

        // Overall statistics
        ProjectModel.aggregate([
          {
            $group: {
              _id: null,
              totalProjects: { $sum: 1 },
              completedProjects: {
                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
              },
              averageProgress: { $avg: "$progress" },
              overdueProjects: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $lt: ["$dueDate", new Date()] },
                        { $ne: ["$status", "completed"] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]),
      ]);

      const statusCounts = statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      const priorityCounts = priorityStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      const overall = overallStats[0] || {
        totalProjects: 0,
        completedProjects: 0,
        averageProgress: 0,
        overdueProjects: 0,
      };

      res.json({
        success: true,
        data: {
          overall: {
            ...overall,
            completionRate:
              overall.totalProjects > 0
                ? Math.round(
                    (overall.completedProjects / overall.totalProjects) * 100
                  )
                : 0,
          },
          byStatus: statusCounts,
          byPriority: priorityCounts,
        },
      });
    } catch (error) {
      console.error("Get project stats error:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving project statistics",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Bulk update projects
   *
   * PATCH /api/users/:userId/projects/bulk
   */
  static async bulkUpdateProjects(req, res) {
    try {
      const { userId } = req.params;
      const { projectIds, updates } = req.body;

      if (
        !projectIds ||
        !Array.isArray(projectIds) ||
        projectIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Project IDs array is required",
        });
      }

      const ProjectModel = await ProjectController.getUserProjectModel(userId);

      const result = await ProjectModel.updateMany(
        { _id: { $in: projectIds } },
        updates,
        { runValidators: true }
      );

      res.json({
        success: true,
        message: `Updated ${result.modifiedCount} projects`,
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
        },
      });
    } catch (error) {
      console.error("Bulk update projects error:", error);
      res.status(500).json({
        success: false,
        message: "Error bulk updating projects",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = ProjectController;
