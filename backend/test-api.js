const axios = require("axios");

const API_BASE_URL = "http://localhost:5000/api";

// Test configuration
const testUser = {
  username: "testuser",
  email: "test@example.com",
  password: "TestPass123",
  firstName: "Test",
  lastName: "User",
};

let authToken = null;
let userId = null;
let taskId = null;

// Helper function to make authenticated requests
const makeAuthRequest = async (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    ...(data && { data }),
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(
      `Error in ${method} ${endpoint}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Test functions
const testHealthCheck = async () => {
  console.log("\n🔍 Testing Health Check...");
  try {
    const response = await axios.get("http://localhost:5000/health");
    console.log("✅ Health check passed:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Health check failed:", error.message);
    return false;
  }
};

const testUserRegistration = async () => {
  console.log("\n🔍 Testing User Registration...");
  try {
    const response = await makeAuthRequest("POST", "/auth/register", testUser);
    console.log(
      "✅ User registration successful:",
      response.data.user.username
    );
    return true;
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response?.data?.message?.includes("already exists")
    ) {
      console.log("ℹ️  User already exists, proceeding with login...");
      return true;
    }
    console.error("❌ User registration failed");
    return false;
  }
};

const testUserLogin = async () => {
  console.log("\n🔍 Testing User Login...");
  try {
    const response = await makeAuthRequest("POST", "/auth/login", {
      identifier: testUser.email,
      password: testUser.password,
    });

    authToken = response.data.token;
    userId = response.data.user.id;
    console.log("✅ User login successful:", response.data.user.username);
    return true;
  } catch (error) {
    console.error("❌ User login failed");
    return false;
  }
};

const testGetCurrentUser = async () => {
  console.log("\n🔍 Testing Get Current User...");
  try {
    const response = await makeAuthRequest("GET", "/auth/me");
    console.log("✅ Get current user successful:", response.data.user.username);
    return true;
  } catch (error) {
    console.error("❌ Get current user failed");
    return false;
  }
};

const testCreateTask = async () => {
  console.log("\n🔍 Testing Create Task...");
  try {
    const taskData = {
      title: "Test Task",
      description: "This is a test task for API testing",
      priority: "medium",
      tags: ["test", "api"],
      estimatedTime: 30,
    };

    const response = await makeAuthRequest("POST", "/tasks", taskData);
    taskId = response.data.task._id;
    console.log("✅ Task creation successful:", response.data.task.title);
    return true;
  } catch (error) {
    console.error("❌ Task creation failed");
    return false;
  }
};

const testGetTodayTasks = async () => {
  console.log("\n🔍 Testing Get Today's Tasks...");
  try {
    const response = await makeAuthRequest("GET", "/tasks/today");
    console.log(
      "✅ Get today's tasks successful:",
      response.data.count,
      "tasks found"
    );
    return true;
  } catch (error) {
    console.error("❌ Get today's tasks failed");
    return false;
  }
};

const testGetAllTasks = async () => {
  console.log("\n🔍 Testing Get All Tasks...");
  try {
    const response = await makeAuthRequest("GET", "/tasks");
    console.log(
      "✅ Get all tasks successful:",
      response.data.pagination.total,
      "total tasks"
    );
    return true;
  } catch (error) {
    console.error("❌ Get all tasks failed");
    return false;
  }
};

const testCompleteTask = async () => {
  console.log("\n🔍 Testing Complete Task...");
  try {
    const response = await makeAuthRequest(
      "PATCH",
      `/tasks/${taskId}/complete`
    );
    console.log("✅ Task completion successful:", response.data.task.status);
    return true;
  } catch (error) {
    console.error("❌ Task completion failed");
    return false;
  }
};

const testGetMotivationalSummary = async () => {
  console.log("\n🔍 Testing Motivational Summary...");
  try {
    const response = await makeAuthRequest("GET", "/summary");
    console.log(
      "✅ Motivational summary successful:",
      response.data.message.substring(0, 100) + "..."
    );
    return true;
  } catch (error) {
    console.error("❌ Motivational summary failed");
    return false;
  }
};

const testGetTaskHistory = async () => {
  console.log("\n🔍 Testing Task History...");
  try {
    const response = await makeAuthRequest("GET", "/tasks/history?days=7");
    console.log(
      "✅ Task history successful:",
      response.data.summary.totalTasks,
      "tasks in history"
    );
    return true;
  } catch (error) {
    console.error("❌ Task history failed");
    return false;
  }
};

const testGetTaskStats = async () => {
  console.log("\n🔍 Testing Task Statistics...");
  try {
    const response = await makeAuthRequest("GET", "/tasks/stats?period=week");
    console.log(
      "✅ Task statistics successful:",
      response.data.stats.total,
      "total tasks"
    );
    return true;
  } catch (error) {
    console.error("❌ Task statistics failed");
    return false;
  }
};

const testDeleteTask = async () => {
  console.log("\n🔍 Testing Delete Task...");
  try {
    const response = await makeAuthRequest("DELETE", `/tasks/${taskId}`);
    console.log("✅ Task deletion successful");
    return true;
  } catch (error) {
    console.error("❌ Task deletion failed");
    return false;
  }
};

const testUserLogout = async () => {
  console.log("\n🔍 Testing User Logout...");
  try {
    const response = await makeAuthRequest("POST", "/auth/logout", {
      refreshToken: "test-refresh-token",
    });
    console.log("✅ User logout successful");
    return true;
  } catch (error) {
    console.error("❌ User logout failed");
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log("🚀 Starting API Tests...\n");

  const tests = [
    { name: "Health Check", fn: testHealthCheck },
    { name: "User Registration", fn: testUserRegistration },
    { name: "User Login", fn: testUserLogin },
    { name: "Get Current User", fn: testGetCurrentUser },
    { name: "Create Task", fn: testCreateTask },
    { name: "Get Today's Tasks", fn: testGetTodayTasks },
    { name: "Get All Tasks", fn: testGetAllTasks },
    { name: "Complete Task", fn: testCompleteTask },
    { name: "Get Motivational Summary", fn: testGetMotivationalSummary },
    { name: "Get Task History", fn: testGetTaskHistory },
    { name: "Get Task Statistics", fn: testGetTaskStats },
    { name: "Delete Task", fn: testDeleteTask },
    { name: "User Logout", fn: testUserLogout },
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} failed with error:`, error.message);
    }
  }

  console.log("\n📊 Test Results:");
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log("\n🎉 All tests passed! The API is working correctly.");
  } else {
    console.log("\n⚠️  Some tests failed. Please check the API configuration.");
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  makeAuthRequest,
};
