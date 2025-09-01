const morgan = require("morgan");
const logger = require("../utils/logger");

// Custom token for response time
morgan.token("response-time-ms", (req, res) => {
  if (!res._header || !req._startAt) return "";
  const diff = process.hrtime(req._startAt);
  const ms = diff[0] * 1e3 + diff[1] * 1e-6;
  return ms.toFixed(2);
});

// Custom token for user ID
morgan.token("user-id", (req) => {
  return req.user?.id || "anonymous";
});

// Custom token for request body size
morgan.token("req-body-size", (req) => {
  if (req.body) {
    return JSON.stringify(req.body).length;
  }
  return 0;
});

// Custom token for response body size
morgan.token("res-body-size", (req, res) => {
  if (res._responseSize) {
    return res._responseSize;
  }
  return 0;
});

// Custom format for detailed logging
const detailedFormat =
  ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms';

// Custom format for JSON logging
const jsonFormat = (tokens, req, res) => {
  return JSON.stringify({
    timestamp: tokens.date(req, res, "iso"),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: tokens["response-time-ms"](req, res),
    contentLength: tokens.res(req, res, "content-length"),
    userAgent: tokens["user-agent"](req, res),
    remoteAddr: tokens["remote-addr"](req, res),
    userId: tokens["user-id"](req, res),
    referrer: tokens.referrer(req, res),
    requestBodySize: tokens["req-body-size"](req, res),
    responseBodySize: tokens["res-body-size"](req, res),
  });
};

// Skip logging for health checks and static files
const skipLogging = (req, res) => {
  return (
    req.url === "/health" ||
    req.url.startsWith("/static/") ||
    req.url.startsWith("/favicon.ico")
  );
};

// Create morgan middleware for different environments
const createMorganMiddleware = () => {
  if (process.env.NODE_ENV === "production") {
    return morgan(jsonFormat, {
      skip: skipLogging,
      stream: {
        write: (message) => {
          try {
            const logData = JSON.parse(message);
            logger.info("HTTP Request", logData);
          } catch (error) {
            logger.info("HTTP Request", { message });
          }
        },
      },
    });
  }

  // Development environment - colored console output
  return morgan(detailedFormat, {
    skip: skipLogging,
    colors: true,
  });
};

// Custom request logger middleware
const requestLogger = (req, res, next) => {
  // Add start time to request object
  req._startAt = process.hrtime();

  // Log request start
  logger.info("Request started", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id || "anonymous",
    timestamp: new Date().toISOString(),
  });

  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    // Calculate response time
    const diff = process.hrtime(req._startAt);
    const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

    // Calculate response size
    if (chunk) {
      res._responseSize = chunk.length;
    }

    // Log response completion
    logger.info("Request completed", {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get("Content-Length") || res._responseSize || 0,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.user?.id || "anonymous",
      timestamp: new Date().toISOString(),
    });

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error("Request error", {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    error: err.message,
    stack: err.stack,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id || "anonymous",
    timestamp: new Date().toISOString(),
  });

  next(err);
};

// Performance monitoring middleware
const performanceLogger = (req, res, next) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

    // Log slow requests (over 1 second)
    if (responseTime > 1000) {
      logger.warn("Slow request detected", {
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
        userId: req.user?.id || "anonymous",
      });
    }

    // Log very slow requests (over 5 seconds)
    if (responseTime > 5000) {
      logger.error("Very slow request detected", {
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
        userId: req.user?.id || "anonymous",
      });
    }
  });

  next();
};

module.exports = {
  createMorganMiddleware,
  requestLogger,
  errorLogger,
  performanceLogger,
};
