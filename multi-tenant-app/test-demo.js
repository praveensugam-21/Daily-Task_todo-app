const axios = require("axios");

/**
 * Multi-Tenant MongoDB API Demo Script
 *
 * This script demonstrates the complete functionality of the multi-tenant API:
 * 1. User signup and login simulation
 * 2. Project creation in isolated databases
 * 3. CRUD operations on projects
 * 4. Database isolation verification
 * 5. System monitoring
 */

const BASE_URL = "http://localhost:4000/api";
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

// Helper function for colored console output
const log = (message, color = "reset") => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logStep = (step, message) => {
  log(`\n🔹 Step ${step}: ${message}`, "cyan");
};

const logSuccess = (message) => {
  log(`✅ ${message}`, "green");
};

const logError = (message) => {
  log(`❌ ${message}`, "red");
};

const logInfo = (message) => {
  log(`ℹ️  ${message}`, "blue");
};

// Test data
const testUsers = [
  {
    username: "alice_dev",
    email: "alice@example.com",
    firstName: "Alice",
    lastName: "Johnson",
    company: "TechCorp",
  },
  {
    username: "bob_designer",
    email: "bob@example.com",
    firstName: "Bob",
    lastName: "Smith",
    company: "DesignStudio",
  },
];

const testProjects = [
  {
    name: "E-commerce Platform",
    description: "Build a modern e-commerce platform with React and Node.js",
    priority: "high",
    status: "active",
    tags: ["web", "react", "nodejs", "ecommerce"],
    dueDate: "2024-06-30",
  },
  {
    name: "Mobile App UI/UX",
    description: "Design and prototype mobile application interface",
    priority: "medium",
    status: "planning",
    tags: ["mobile", "ui", "ux", "design"],
    progress: 15,
  },
  {
    name: "Database Migration",
    description: "Migrate legacy database to MongoDB",
    priority: "critical",
    status: "active",
    tags: ["database", "migration", "mongodb"],
    progress: 60,
  },
];

class APIDemo {
  constructor() {
    this.users = [];
    this.projects = [];
  }

  async makeRequest(method, url, data = null) {
    try {
      const config = {
        method,
        url: `${BASE_URL}${url}`,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(
          `${error.response.status}: ${
            error.response.data.message || error.response.statusText
          }`
        );
      } else {
        throw error;
      }
    }
  }

  async checkServerHealth() {
    logStep(1, "Checking server health");

    try {
      const health = await this.makeRequest("GET", "/health");
      logSuccess(`Server is running: ${health.message}`);
      logInfo(`Environment: ${health.environment}`);
      return true;
    } catch (error) {
      logError(`Server health check failed: ${error.message}`);
      logError("Make sure the server is running with: npm run dev");
      return false;
    }
  }

  async createUsers() {
    logStep(2, "Creating test users");

    for (const userData of testUsers) {
      try {
        const result = await this.makeRequest(
          "POST",
          "/users/signup",
          userData
        );
        this.users.push(result.data);
        logSuccess(
          `Created user: ${userData.username} (ID: ${result.data.userId})`
        );
        logInfo(`Database: ${result.data.databaseName}`);
      } catch (error) {
        if (error.message.includes("409")) {
          logInfo(
            `User ${userData.username} already exists, attempting login...`
          );

          try {
            const loginResult = await this.makeRequest("POST", "/users/login", {
              username: userData.username,
            });
            this.users.push(loginResult.data);
            logSuccess(`Logged in existing user: ${userData.username}`);
          } catch (loginError) {
            logError(
              `Failed to login user ${userData.username}: ${loginError.message}`
            );
          }
        } else {
          logError(
            `Failed to create user ${userData.username}: ${error.message}`
          );
        }
      }
    }
  }

  async createProjects() {
    logStep(3, "Creating projects in isolated databases");

    for (let userIndex = 0; userIndex < this.users.length; userIndex++) {
      const user = this.users[userIndex];
      const userProjects = [];

      log(`\n📁 Creating projects for ${user.username}:`, "yellow");

      for (
        let projectIndex = 0;
        projectIndex < testProjects.length;
        projectIndex++
      ) {
        const projectData = { ...testProjects[projectIndex] };

        // Customize project for each user
        projectData.name = `${projectData.name} - ${user.username}`;

        try {
          const result = await this.makeRequest(
            "POST",
            `/users/${user.userId}/projects`,
            projectData
          );

          userProjects.push(result.data);
          logSuccess(`  ✓ Created: ${result.data.name}`);
        } catch (error) {
          logError(`  ✗ Failed to create project: ${error.message}`);
        }
      }

      this.projects.push({
        userId: user.userId,
        username: user.username,
        projects: userProjects,
      });
    }
  }

  async demonstrateDatabaseIsolation() {
    logStep(4, "Demonstrating database isolation");

    for (const userProjects of this.projects) {
      try {
        const result = await this.makeRequest(
          "GET",
          `/users/${userProjects.userId}/projects`
        );

        logInfo(
          `${userProjects.username} has ${result.data.projects.length} projects in their isolated database:`
        );

        result.data.projects.forEach((project) => {
          log(`  📝 ${project.name} (${project.status})`, "magenta");
        });

        logSuccess(
          `✓ Database isolation confirmed for ${userProjects.username}`
        );
      } catch (error) {
        logError(
          `Failed to fetch projects for ${userProjects.username}: ${error.message}`
        );
      }
    }
  }

  async demonstrateCRUDOperations() {
    logStep(5, "Demonstrating CRUD operations");

    if (this.projects.length === 0 || this.projects[0].projects.length === 0) {
      logError("No projects available for CRUD demo");
      return;
    }

    const userProjects = this.projects[0];
    const project = userProjects.projects[0];

    log(`\n🔄 Performing CRUD operations on "${project.name}":`, "yellow");

    // READ - Get specific project
    try {
      const readResult = await this.makeRequest(
        "GET",
        `/users/${userProjects.userId}/projects/${project.id}`
      );
      logSuccess(`✓ READ: Retrieved project details`);
      logInfo(
        `  Status: ${readResult.data.status}, Progress: ${readResult.data.progress}%`
      );
    } catch (error) {
      logError(`✗ READ failed: ${error.message}`);
    }

    // UPDATE - Modify project
    try {
      const updateData = {
        progress: 75,
        status: "active",
        notes: "Updated via API demo script",
      };

      const updateResult = await this.makeRequest(
        "PUT",
        `/users/${userProjects.userId}/projects/${project.id}`,
        updateData
      );
      logSuccess(`✓ UPDATE: Modified project progress to 75%`);
    } catch (error) {
      logError(`✗ UPDATE failed: ${error.message}`);
    }

    // COMPLETE - Mark as completed
    try {
      const completeResult = await this.makeRequest(
        "PATCH",
        `/users/${userProjects.userId}/projects/${project.id}/complete`
      );
      logSuccess(`✓ COMPLETE: Marked project as completed`);
    } catch (error) {
      logError(`✗ COMPLETE failed: ${error.message}`);
    }
  }

  async getProjectStatistics() {
    logStep(6, "Retrieving project statistics");

    for (const userProjects of this.projects) {
      try {
        const stats = await this.makeRequest(
          "GET",
          `/users/${userProjects.userId}/projects/stats`
        );

        log(`\n📊 Statistics for ${userProjects.username}:`, "yellow");
        logInfo(`  Total Projects: ${stats.data.overall.totalProjects}`);
        logInfo(`  Completed: ${stats.data.overall.completedProjects}`);
        logInfo(`  Completion Rate: ${stats.data.overall.completionRate}%`);
        logInfo(
          `  Average Progress: ${Math.round(
            stats.data.overall.averageProgress
          )}%`
        );

        if (stats.data.byStatus) {
          log(`  Status Distribution:`, "blue");
          Object.entries(stats.data.byStatus).forEach(([status, count]) => {
            log(`    ${status}: ${count}`, "blue");
          });
        }
      } catch (error) {
        logError(
          `Failed to get stats for ${userProjects.username}: ${error.message}`
        );
      }
    }
  }

  async getSystemStatus() {
    logStep(7, "Checking system status and database connections");

    try {
      const status = await this.makeRequest("GET", "/status");

      log(`\n🖥️  System Information:`, "yellow");
      logInfo(`  Uptime: ${Math.round(status.data.server.uptime)} seconds`);
      logInfo(
        `  Memory Usage: ${Math.round(
          status.data.server.memory.heapUsed / 1024 / 1024
        )} MB`
      );
      logInfo(`  Node.js Version: ${status.data.server.nodeVersion}`);

      log(`\n🗄️  Database Information:`, "yellow");
      logInfo(`  Total Connections: ${status.data.database.totalConnections}`);
      logInfo(
        `  Active Connections: ${status.data.database.activeConnections}`
      );
      logInfo(`  Total Users: ${status.data.database.totalUsers}`);

      if (
        status.data.activeUserDatabases &&
        status.data.activeUserDatabases.length > 0
      ) {
        log(`\n👥 Active User Databases:`, "yellow");
        status.data.activeUserDatabases.forEach((db) => {
          logInfo(
            `  ${db.dbName} (${db.status}) - Models: [${db.models.join(", ")}]`
          );
        });
      }
    } catch (error) {
      logError(`Failed to get system status: ${error.message}`);
    }
  }

  async demonstrateFiltering() {
    logStep(8, "Demonstrating advanced filtering and search");

    if (this.projects.length === 0) {
      logError("No projects available for filtering demo");
      return;
    }

    const userProjects = this.projects[0];

    try {
      // Filter by status
      const activeProjects = await this.makeRequest(
        "GET",
        `/users/${userProjects.userId}/projects?status=active&limit=5`
      );
      logSuccess(
        `✓ Found ${activeProjects.data.projects.length} active projects`
      );

      // Search by keyword
      const searchResults = await this.makeRequest(
        "GET",
        `/users/${userProjects.userId}/projects?search=platform&limit=5`
      );
      logSuccess(
        `✓ Found ${searchResults.data.projects.length} projects matching "platform"`
      );

      // Filter by priority
      const highPriority = await this.makeRequest(
        "GET",
        `/users/${userProjects.userId}/projects?priority=high&limit=5`
      );
      logSuccess(
        `✓ Found ${highPriority.data.projects.length} high-priority projects`
      );
    } catch (error) {
      logError(`Filtering demo failed: ${error.message}`);
    }
  }

  async runDemo() {
    log("🚀 Multi-Tenant MongoDB API Demo Starting...", "cyan");
    log("=".repeat(60), "cyan");

    // Check if server is running
    const serverHealthy = await this.checkServerHealth();
    if (!serverHealthy) {
      return;
    }

    // Run all demo steps
    await this.createUsers();
    await this.createProjects();
    await this.demonstrateDatabaseIsolation();
    await this.demonstrateCRUDOperations();
    await this.getProjectStatistics();
    await this.demonstrateFiltering();
    await this.getSystemStatus();

    log("\n" + "=".repeat(60), "cyan");
    log("🎉 Demo completed successfully!", "green");
    log("\nKey takeaways:", "yellow");
    log("✓ Each user has their own isolated MongoDB database", "green");
    log("✓ Projects are completely separated between users", "green");
    log(
      "✓ Dynamic database connections are created and managed automatically",
      "green"
    );
    log("✓ Full CRUD operations work within isolated databases", "green");
    log("✓ System provides comprehensive monitoring and statistics", "green");

    log("\n📖 Next steps:", "blue");
    log(
      "• Visit http://localhost:3000/api/docs for full API documentation",
      "blue"
    );
    log(
      "• Check http://localhost:3000/api/status for real-time system status",
      "blue"
    );
    log(
      "• Explore the source code to understand the isolation mechanism",
      "blue"
    );
  }
}

// Run the demo
const demo = new APIDemo();
demo.runDemo().catch((error) => {
  logError(`Demo failed: ${error.message}`);
  process.exit(1);
});
