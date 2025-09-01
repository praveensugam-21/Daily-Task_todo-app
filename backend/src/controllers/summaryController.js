const OpenAI = require("openai");
const Task = require("../models/Task");
const { AppError, asyncHandler } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// @desc    Get motivational summary
// @route   GET /api/summary
// @access  Private
const getMotivationalSummary = asyncHandler(async (req, res) => {
  try {
    // Get yesterday's completed tasks
    const completedTasks = await Task.getYesterdayCompleted(req.user._id);

    if (completedTasks.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          message:
            "Yesterday was a rest day! That's perfectly fine. Every day is a new opportunity to accomplish great things. What would you like to focus on today?",
          completedTasks: [],
          taskCount: 0,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        },
      });
    }

    // Prepare task data for AI
    const taskSummaries = completedTasks.map((task) => ({
      title: task.title,
      priority: task.priority,
      estimatedTime: task.estimatedTime,
      actualTime: task.actualTime,
      tags: task.tags,
    }));

    // Calculate statistics
    const totalTasks = completedTasks.length;
    const highPriorityTasks = completedTasks.filter(
      (task) => task.priority === "high" || task.priority === "urgent"
    ).length;
    const totalEstimatedTime = completedTasks.reduce(
      (sum, task) => sum + (task.estimatedTime || 0),
      0
    );
    const totalActualTime = completedTasks.reduce(
      (sum, task) => sum + (task.actualTime || 0),
      0
    );
    const efficiency =
      totalEstimatedTime > 0
        ? Math.round((totalActualTime / totalEstimatedTime) * 100)
        : 100;

    // Generate AI prompt
    const prompt = generateMotivationalPrompt(taskSummaries, {
      totalTasks,
      highPriorityTasks,
      efficiency,
      userName: req.user.firstName || req.user.username,
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a motivational coach and productivity expert. Your role is to provide personalized, encouraging messages based on a user's completed tasks. Be positive, specific, and actionable. Keep responses under 300 words and use a warm, supportive tone.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiMessage = completion.choices[0].message.content;

    logger.info("Motivational summary generated successfully", {
      userId: req.user._id,
      taskCount: totalTasks,
      aiModel: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    });

    res.status(200).json({
      success: true,
      data: {
        message: aiMessage,
        completedTasks: taskSummaries,
        statistics: {
          totalTasks,
          highPriorityTasks,
          efficiency,
          totalEstimatedTime,
          totalActualTime,
        },
        date: new Date(Date.now() - 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
    });
  } catch (error) {
    logger.error("Error generating motivational summary:", error);

    // If AI service fails, provide a fallback message
    if (
      error.code === "insufficient_quota" ||
      error.code === "rate_limit_exceeded"
    ) {
      return res.status(503).json({
        error: "AI service temporarily unavailable",
        message:
          "Our AI service is currently experiencing high demand. Please try again later.",
        fallback: true,
      });
    }

    if (error.code === "invalid_api_key") {
      return res.status(503).json({
        error: "AI service configuration error",
        message:
          "AI service is not properly configured. Please contact support.",
        fallback: true,
      });
    }

    // For other AI errors, provide a fallback message
    const completedTasks = await Task.getYesterdayCompleted(req.user._id);
    const fallbackMessage = generateFallbackMessage(
      completedTasks,
      req.user.firstName || req.user.username
    );

    res.status(200).json({
      success: true,
      data: {
        message: fallbackMessage,
        completedTasks: completedTasks.map((task) => ({
          title: task.title,
          priority: task.priority,
          estimatedTime: task.estimatedTime,
          actualTime: task.actualTime,
          tags: task.tags,
        })),
        taskCount: completedTasks.length,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        fallback: true,
      },
    });
  }
});

// Generate motivational prompt for AI
const generateMotivationalPrompt = (tasks, stats) => {
  const taskList = tasks
    .map(
      (task) =>
        `- ${task.title} (${task.priority} priority${
          task.tags.length > 0 ? `, tags: ${task.tags.join(", ")}` : ""
        })`
    )
    .join("\n");

  return `Based on the following completed tasks from yesterday, provide a motivational and encouraging message:

Completed Tasks:
${taskList}

Statistics:
- Total tasks completed: ${stats.totalTasks}
- High priority tasks: ${stats.highPriorityTasks}
- Efficiency: ${stats.efficiency}%

User: ${stats.userName}

Please provide a personalized motivational message that:
1. Acknowledges their accomplishments
2. Highlights their productivity patterns
3. Offers encouragement for today
4. Suggests ways to build on their success
5. Uses their name and specific task details when relevant

Keep it positive, specific, and actionable.`;
};

// Generate fallback message when AI is unavailable
const generateFallbackMessage = (tasks, userName) => {
  if (tasks.length === 0) {
    return `Hello ${userName}! Yesterday was a rest day, and that's perfectly fine. Every day is a new opportunity to accomplish great things. What would you like to focus on today?`;
  }

  const taskCount = tasks.length;
  const highPriorityCount = tasks.filter(
    (task) => task.priority === "high" || task.priority === "urgent"
  ).length;

  let message = `Great job yesterday, ${userName}! You completed ${taskCount} task${
    taskCount > 1 ? "s" : ""
  }`;

  if (highPriorityCount > 0) {
    message += `, including ${highPriorityCount} high-priority item${
      highPriorityCount > 1 ? "s" : ""
    }`;
  }

  message += `. Your dedication to productivity is inspiring! Keep up this momentum today and remember that every completed task brings you closer to your goals. You've got this!`;

  return message;
};

// @desc    Get weekly summary
// @route   GET /api/summary/weekly
// @access  Private
const getWeeklySummary = asyncHandler(async (req, res) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  // Get tasks for the past week
  const tasks = await Task.find({
    user: req.user._id,
    createdAt: { $gte: startDate, $lte: endDate },
  });

  const completedTasks = tasks.filter((task) => task.status === "completed");
  const pendingTasks = tasks.filter((task) => task.status === "pending");
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress");

  // Calculate weekly statistics
  const stats = {
    total: tasks.length,
    completed: completedTasks.length,
    pending: pendingTasks.length,
    inProgress: inProgressTasks.length,
    completionRate:
      tasks.length > 0
        ? Math.round((completedTasks.length / tasks.length) * 100)
        : 0,
    averageTasksPerDay: Math.round((tasks.length / 7) * 10) / 10,
    mostProductiveDay: getMostProductiveDay(completedTasks),
    priorityBreakdown: {
      low: tasks.filter((t) => t.priority === "low").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      high: tasks.filter((t) => t.priority === "high").length,
      urgent: tasks.filter((t) => t.priority === "urgent").length,
    },
  };

  // Generate weekly message
  let weeklyMessage = `Weekly Summary for ${
    req.user.firstName || req.user.username
  }:\n\n`;
  weeklyMessage += `You completed ${stats.completed} out of ${stats.total} tasks this week (${stats.completionRate}% completion rate). `;

  if (stats.completionRate >= 80) {
    weeklyMessage +=
      "Excellent work! You're maintaining a high level of productivity.";
  } else if (stats.completionRate >= 60) {
    weeklyMessage += "Good progress! You're on the right track.";
  } else {
    weeklyMessage +=
      "Keep pushing forward! Every effort counts toward your goals.";
  }

  weeklyMessage += `\n\nYour most productive day was ${stats.mostProductiveDay}. `;
  weeklyMessage += `You averaged ${stats.averageTasksPerDay} tasks per day. `;

  if (stats.pending > 0) {
    weeklyMessage += `\n\nYou have ${stats.pending} pending tasks. Consider reviewing and prioritizing them for next week.`;
  }

  res.status(200).json({
    success: true,
    data: {
      message: weeklyMessage,
      statistics: stats,
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
    },
  });
});

// Helper function to find most productive day
const getMostProductiveDay = (completedTasks) => {
  const dayCounts = {};
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  completedTasks.forEach((task) => {
    const day = days[task.completedAt.getDay()];
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  const mostProductiveDay = Object.keys(dayCounts).reduce((a, b) =>
    dayCounts[a] > dayCounts[b] ? a : b
  );

  return mostProductiveDay || "No completed tasks";
};

// @desc    Get productivity insights
// @route   GET /api/summary/insights
// @access  Private
const getProductivityInsights = asyncHandler(async (req, res) => {
  const { period = "month" } = req.query;

  let startDate;
  const now = new Date();

  switch (period) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter":
      startDate = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1
      );
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Get tasks for the period
  const tasks = await Task.find({
    user: req.user._id,
    createdAt: { $gte: startDate },
  });

  const completedTasks = tasks.filter((task) => task.status === "completed");

  // Generate insights
  const insights = {
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    completionRate:
      tasks.length > 0
        ? Math.round((completedTasks.length / tasks.length) * 100)
        : 0,
    averageTasksPerDay:
      tasks.length > 0
        ? Math.round(
            (tasks.length /
              Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))) *
              10
          ) / 10
        : 0,
    topTags: getTopTags(tasks),
    priorityDistribution: getPriorityDistribution(tasks),
    productivityTrend: getProductivityTrend(completedTasks, startDate, now),
    recommendations: generateRecommendations(tasks, completedTasks),
  };

  res.status(200).json({
    success: true,
    data: {
      insights,
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: now.toISOString().split("T")[0],
        type: period,
      },
    },
  });
});

// Helper functions for insights
const getTopTags = (tasks) => {
  const tagCounts = {};
  tasks.forEach((task) => {
    task.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));
};

const getPriorityDistribution = (tasks) => {
  const distribution = { low: 0, medium: 0, high: 0, urgent: 0 };
  tasks.forEach((task) => {
    distribution[task.priority]++;
  });
  return distribution;
};

const getProductivityTrend = (completedTasks, startDate, endDate) => {
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const dailyCounts = new Array(days).fill(0);

  completedTasks.forEach((task) => {
    const dayIndex = Math.floor(
      (task.completedAt - startDate) / (1000 * 60 * 60 * 24)
    );
    if (dayIndex >= 0 && dayIndex < days) {
      dailyCounts[dayIndex]++;
    }
  });

  return dailyCounts;
};

const generateRecommendations = (tasks, completedTasks) => {
  const recommendations = [];

  const completionRate =
    tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  if (completionRate < 60) {
    recommendations.push(
      "Consider breaking down larger tasks into smaller, more manageable pieces"
    );
  }

  if (
    completedTasks.filter(
      (t) => t.priority === "high" || t.priority === "urgent"
    ).length <
    completedTasks.length * 0.3
  ) {
    recommendations.push(
      "Try to focus more on high-priority tasks to maximize your impact"
    );
  }

  if (tasks.filter((t) => t.tags.length === 0).length > tasks.length * 0.5) {
    recommendations.push(
      "Using tags can help you better organize and track related tasks"
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "You're doing great! Keep up the excellent work and maintain your current productivity patterns"
    );
  }

  return recommendations;
};

module.exports = {
  getMotivationalSummary,
  getWeeklySummary,
  getProductivityInsights,
};
