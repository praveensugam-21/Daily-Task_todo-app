const mongoose = require("mongoose");

/**
 * Multi-Tenant Database Manager
 *
 * This module provides per-user database isolation by creating separate MongoDB
 * databases for each tenant/user. Each user gets their own isolated database
 * while sharing the same MongoDB cluster/instance.
 *
 * Key Features:
 * - Dynamic database creation per user
 * - Connection pooling and reuse
 * - Automatic cleanup of inactive connections
 * - Graceful shutdown handling
 * - Memory-efficient connection management
 */

class DatabaseManager {
  constructor() {
    // Store active database connections per user
    // Format: { userId: { connection, models, lastAccessed } }
    this.connections = new Map();

    // Track connection metrics
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      totalUsers: 0,
    };

    // Configuration from environment
    this.config = {
      baseUrl: process.env.MONGODB_BASE_URL || "mongodb://localhost:27017",
      dbPrefix: process.env.DB_PREFIX || "tenant_",
      maxConnectionsPerDb: parseInt(process.env.MAX_CONNECTIONS_PER_DB) || 10,
      cleanupIntervalMinutes:
        parseInt(process.env.CLEANUP_INACTIVE_CONNECTIONS_MINUTES) || 30,
    };

    // Start periodic cleanup of inactive connections
    this.startCleanupTimer();

    // Handle graceful shutdown
    this.setupGracefulShutdown();
  }

  /**
   * Get or create a database connection for a specific user
   *
   * @param {string} userId - Unique user identifier
   * @returns {Promise<mongoose.Connection>} - User's dedicated database connection
   */
  async getUserDatabase(userId) {
    if (!userId) {
      throw new Error("User ID is required for database connection");
    }

    // Check if connection already exists and is active
    if (this.connections.has(userId)) {
      const connectionInfo = this.connections.get(userId);

      // Update last accessed time
      connectionInfo.lastAccessed = new Date();

      // Return existing connection if it's ready
      if (connectionInfo.connection.readyState === 1) {
        return connectionInfo.connection;
      }
    }

    // Create new database connection for this user
    const dbName = `${this.config.dbPrefix}${userId}`;
    const connectionString = `${this.config.baseUrl}/${dbName}`;

    console.log(
      `Creating new database connection for user: ${userId}, database: ${dbName}`
    );

    try {
      // Create connection with optimized settings
      const connection = await mongoose.createConnection(connectionString, {
        maxPoolSize: this.config.maxConnectionsPerDb, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable mongoose buffering
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      // Handle connection events
      connection.on("connected", () => {
        console.log(`✅ Connected to database: ${dbName}`);
        this.metrics.activeConnections++;
      });

      connection.on("error", (err) => {
        console.error(`❌ Database connection error for ${dbName}:`, err);
      });

      connection.on("disconnected", () => {
        console.log(`⚠️ Disconnected from database: ${dbName}`);
        this.metrics.activeConnections--;
      });

      // Store connection info
      this.connections.set(userId, {
        connection,
        models: new Map(), // Will store registered models for this user
        lastAccessed: new Date(),
        dbName,
      });

      this.metrics.totalConnections++;
      this.metrics.totalUsers = this.connections.size;

      return connection;
    } catch (error) {
      console.error(
        `Failed to create database connection for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get a model for a specific user's database
   * Models are cached per user to avoid re-compilation
   *
   * @param {string} userId - User identifier
   * @param {string} modelName - Name of the model (e.g., "Project")
   * @param {mongoose.Schema} schema - Mongoose schema
   * @returns {Promise<mongoose.Model>} - User-specific model instance
   */
  async getUserModel(userId, modelName, schema) {
    const connectionInfo = this.connections.get(userId);

    if (!connectionInfo) {
      // Create connection if it doesn't exist
      await this.getUserDatabase(userId);
      return this.getUserModel(userId, modelName, schema);
    }

    // Check if model already exists for this user
    if (connectionInfo.models.has(modelName)) {
      return connectionInfo.models.get(modelName);
    }

    // Create and cache the model
    const model = connectionInfo.connection.model(modelName, schema);
    connectionInfo.models.set(modelName, model);

    console.log(`📝 Created model "${modelName}" for user: ${userId}`);

    return model;
  }

  /**
   * Get connection statistics
   * Useful for monitoring and debugging
   */
  getStats() {
    const activeConnections = Array.from(this.connections.entries()).map(
      ([userId, info]) => ({
        userId,
        dbName: info.dbName,
        readyState: info.connection.readyState,
        lastAccessed: info.lastAccessed,
        models: Array.from(info.models.keys()),
      })
    );

    return {
      ...this.metrics,
      activeConnections,
      config: this.config,
    };
  }

  /**
   * Cleanup inactive connections to prevent memory leaks
   * Called periodically to close connections that haven't been used recently
   */
  async cleanupInactiveConnections() {
    const cutoffTime = new Date(
      Date.now() - this.config.cleanupIntervalMinutes * 60 * 1000
    );
    const connectionsToClose = [];

    for (const [userId, connectionInfo] of this.connections.entries()) {
      if (connectionInfo.lastAccessed < cutoffTime) {
        connectionsToClose.push(userId);
      }
    }

    for (const userId of connectionsToClose) {
      await this.closeUserConnection(userId);
    }

    if (connectionsToClose.length > 0) {
      console.log(
        `🧹 Cleaned up ${connectionsToClose.length} inactive connections`
      );
    }
  }

  /**
   * Close a specific user's database connection
   *
   * @param {string} userId - User identifier
   */
  async closeUserConnection(userId) {
    const connectionInfo = this.connections.get(userId);

    if (connectionInfo) {
      try {
        await connectionInfo.connection.close();
        this.connections.delete(userId);
        this.metrics.totalUsers = this.connections.size;
        console.log(`🔐 Closed database connection for user: ${userId}`);
      } catch (error) {
        console.error(`Error closing connection for user ${userId}:`, error);
      }
    }
  }

  /**
   * Start the periodic cleanup timer
   */
  startCleanupTimer() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveConnections().catch(console.error);
    }, this.config.cleanupIntervalMinutes * 60 * 1000);

    console.log(
      `⏰ Started connection cleanup timer (${this.config.cleanupIntervalMinutes} minutes)`
    );
  }

  /**
   * Gracefully shutdown all connections
   * Called when the application is terminating
   */
  async shutdown() {
    console.log("🛑 Shutting down database connections...");

    // Clear cleanup timer
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Close all active connections
    const closePromises = Array.from(this.connections.keys()).map((userId) =>
      this.closeUserConnection(userId)
    );

    await Promise.all(closePromises);

    console.log("✅ All database connections closed");
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
      await this.shutdown();
      process.exit(0);
    };

    // Handle different termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2")); // Nodemon restart
  }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

module.exports = databaseManager;
