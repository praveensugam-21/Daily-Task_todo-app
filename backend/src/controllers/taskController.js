const Task = require("../models/Task");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

// @desc    Get today's tasks
// @route   GET /api/tasks/today
// @access  Private
const getTodayTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.getTodayTasks(req.user._id);

  logger.info("Today's tasks retrieved", {
    userId: req.user._id,
    taskCount: tasks.length,
  });

  res.status(200).json({
    success: true,
    data: {
      tasks,
      count: tasks.length,
      date: new Date().toISOString().split("T")[0],
    },
  });
});

// @desc    Get all tasks with pagination and filtering
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
    status,
    priority,
    tags,
    search,
  } = req.query;

  // Build query
  const query = { user: req.user._id };

  if (status) {
    query.status = status;
  }

  if (priority) {
    query.priority = priority;
  }

  if (tags) {
    const tagArray = tags.split(",").map((tag) => tag.trim());
    query.tags = { $in: tagArray };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query
  const tasks = await Task.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate("subtasks", "title status priority");

  // Get total count
  const total = await Task.countDocuments(query);

  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  logger.info("Tasks retrieved with filters", {
    userId: req.user._id,
    taskCount: tasks.length,
    total,
    page,
    limit,
  });

  res.status(200).json({
    success: true,
    data: {
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    },
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate("subtasks", "title status priority dueDate");

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  res.status(200).json({
    success: true,
    data: { task },
  });
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const taskData = {
    ...req.body,
    user: req.user._id,
  };

  const task = await Task.create(taskData);

  logger.info("Task created successfully", {
    userId: req.user._id,
    taskId: task._id,
    taskTitle: task.title,
  });

  res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: { task },
  });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user._id,
    },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  ).populate("subtasks", "title status priority dueDate");

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  logger.info("Task updated successfully", {
    userId: req.user._id,
    taskId: task._id,
    taskTitle: task.title,
  });

  res.status(200).json({
    success: true,
    message: "Task updated successfully",
    data: { task },
  });
});

// @desc    Mark task as complete
// @route   PATCH /api/tasks/:id/complete
// @access  Private
const completeTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (task.status === "completed") {
    throw new AppError("Task is already completed", 400);
  }

  // Mark as complete
  await task.markComplete();

  logger.info("Task marked as complete", {
    userId: req.user._id,
    taskId: task._id,
    taskTitle: task.title,
  });

  res.status(200).json({
    success: true,
    message: "Task marked as complete",
    data: { task },
  });
});

// @desc    Restore task (mark as pending)
// @route   PATCH /api/tasks/:id/restore
// @access  Private
const restoreTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (task.status !== "completed") {
    throw new AppError("Task is not completed", 400);
  }

  // Restore task
  await task.restore();

  logger.info("Task restored", {
    userId: req.user._id,
    taskId: task._id,
    taskTitle: task.title,
  });

  res.status(200).json({
    success: true,
    message: "Task restored successfully",
    data: { task },
  });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  logger.info("Task deleted successfully", {
    userId: req.user._id,
    taskId: task._id,
    taskTitle: task.title,
  });

  res.status(200).json({
    success: true,
    message: "Task deleted successfully",
  });
});

// @desc    Get task history
// @route   GET /api/tasks/history
// @access  Private
const getTaskHistory = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const tasks = await Task.getTaskHistory(req.user._id, parseInt(days));

  // Group tasks by date
  const groupedTasks = tasks.reduce((acc, task) => {
    const date = task.createdAt.toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {});

  // Convert to array and sort by date
  const history = Object.entries(groupedTasks)
    .map(([date, tasks]) => ({
      date,
      tasks,
      count: tasks.length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  logger.info("Task history retrieved", {
    userId: req.user._id,
    days: parseInt(days),
    totalTasks: tasks.length,
    historyEntries: history.length,
  });

  res.status(200).json({
    success: true,
    data: {
      history,
      summary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.status === "completed").length,
        pendingTasks: tasks.filter((t) => t.status === "pending").length,
        days: parseInt(days),
      },
    },
  });
});

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
const getTaskStats = asyncHandler(async (req, res) => {
  const { period = "week" } = req.query;

  let startDate;
  const now = new Date();

  switch (period) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  // Get tasks in period
  const tasks = await Task.find({
    user: req.user._id,
    createdAt: { $gte: startDate },
  });

  // Calculate statistics
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    cancelled: tasks.filter((t) => t.status === "cancelled").length,
    byPriority: {
      low: tasks.filter((t) => t.priority === "low").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      high: tasks.filter((t) => t.priority === "high").length,
      urgent: tasks.filter((t) => t.priority === "urgent").length,
    },
    completionRate:
      tasks.length > 0
        ? Math.round(
            (tasks.filter((t) => t.status === "completed").length /
              tasks.length) *
              100
          )
        : 0,
    averageCompletionTime: 0, // Would need to calculate based on actual time tracking
    period,
    startDate,
    endDate: now,
  };

  logger.info("Task statistics retrieved", {
    userId: req.user._id,
    period,
    totalTasks: stats.total,
  });

  res.status(200).json({
    success: true,
    data: { stats },
  });
});

// @desc    Bulk update tasks
// @route   PATCH /api/tasks/bulk
// @access  Private
const bulkUpdateTasks = asyncHandler(async (req, res) => {
  const { taskIds, updates } = req.body;

  if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
    throw new AppError("Task IDs are required", 400);
  }

  if (!updates || Object.keys(updates).length === 0) {
    throw new AppError("Updates are required", 400);
  }

  // Update tasks
  const result = await Task.updateMany(
    {
      _id: { $in: taskIds },
      user: req.user._id,
    },
    updates
  );

  logger.info("Bulk task update completed", {
    userId: req.user._id,
    taskCount: taskIds.length,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  });

  res.status(200).json({
    success: true,
    message: "Tasks updated successfully",
    data: {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    },
  });
});

// @desc    Bulk delete tasks
// @route   DELETE /api/tasks/bulk
// @access  Private
const bulkDeleteTasks = asyncHandler(async (req, res) => {
  const { taskIds } = req.body;

  if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
    throw new AppError("Task IDs are required", 400);
  }

  // Delete tasks
  const result = await Task.deleteMany({
    _id: { $in: taskIds },
    user: req.user._id,
  });

  logger.info("Bulk task deletion completed", {
    userId: req.user._id,
    taskCount: taskIds.length,
    deletedCount: result.deletedCount,
  });

  res.status(200).json({
    success: true,
    message: "Tasks deleted successfully",
    data: {
      deletedCount: result.deletedCount,
    },
  });
});

module.exports = {
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
};
