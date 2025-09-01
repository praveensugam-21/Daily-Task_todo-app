# Multi-Tenant MongoDB Node.js Application

A complete Node.js application demonstrating **per-user database isolation** using Express, MongoDB, and Mongoose. Each user gets their own isolated MongoDB database while sharing the same application instance.

## 🚀 Features

### Core Functionality

- **Per-User Database Isolation**: Each user gets their own MongoDB database
- **Dynamic Connection Management**: Automatic database connection creation and management
- **User Management**: Simple signup/login simulation with unique user IDs
- **CRUD Operations**: Full Create, Read, Update, Delete operations for projects
- **Connection Pooling**: Efficient connection reuse and automatic cleanup
- **Graceful Shutdown**: Proper cleanup of all database connections

### Advanced Features

- **Real-time Statistics**: Project and system statistics
- **Bulk Operations**: Bulk update multiple projects
- **Search & Filtering**: Advanced project filtering and search
- **Data Validation**: Comprehensive input validation using Mongoose
- **Error Handling**: Centralized error handling with detailed responses
- **Request Logging**: Development and production logging
- **Security Headers**: Helmet.js security middleware
- **CORS Support**: Configurable cross-origin resource sharing

## 🏗️ Architecture

### Database Isolation Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Cluster                         │
├─────────────────────────────────────────────────────────────┤
│  app_users (Central)     │  tenant_user1  │  tenant_user2  │
│  ┌─────────────────┐    │  ┌───────────┐  │  ┌───────────┐  │
│  │ Users Collection│    │  │ Projects  │  │  │ Projects  │  │
│  │ - user1         │    │  │ - proj1   │  │  │ - proj3   │  │
│  │ - user2         │    │  │ - proj2   │  │  │ - proj4   │  │
│  │ - metadata      │    │  │ - ...     │  │  │ - ...     │  │
│  └─────────────────┘    │  └───────────┘  │  └───────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### How It Works

1. **User Signup**: Creates user in central `app_users` database
2. **Database Creation**: Generates unique database name (`tenant_${userId}`)
3. **Dynamic Connections**: Creates MongoDB connection for user's database on-demand
4. **Model Isolation**: Each user's models operate on their isolated database
5. **Connection Cleanup**: Automatically closes inactive connections to prevent memory leaks

## 📋 Prerequisites

- **Node.js** >= 16.0.0
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn**

## ⚡ Quick Start

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd multi-tenant-app

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your MongoDB connection details
nano .env
```

### 2. Configure Environment

Edit `.env` file with your settings:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration - Update this with your MongoDB URL
MONGODB_BASE_URL=mongodb://localhost:27017
# For MongoDB Atlas:
# MONGODB_BASE_URL=mongodb+srv://username:password@cluster.mongodb.net

# Database Configuration
DB_PREFIX=tenant_
MAX_CONNECTIONS_PER_DB=10
CLEANUP_INACTIVE_CONNECTIONS_MINUTES=30

# Security
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

### 3. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 4. Verify Installation

```bash
# Health check
curl http://localhost:3000/api/health

# API documentation
curl http://localhost:3000/api/docs

# System status
curl http://localhost:3000/api/status
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### User Management

#### Create User Account

```bash
POST /api/users/signup
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Corp"
}
```

#### User Login (Simulation)

```bash
POST /api/users/login
Content-Type: application/json

{
  "username": "john_doe"
}
# OR
{
  "email": "john@example.com"
}
```

#### Get User Profile

```bash
GET /api/users/profile/{userId}
```

### Project Management

#### Create Project

```bash
POST /api/users/{userId}/projects
Content-Type: application/json

{
  "name": "Website Redesign",
  "description": "Complete overhaul of company website",
  "priority": "high",
  "status": "active",
  "dueDate": "2024-12-31",
  "tags": ["web", "design", "urgent"],
  "progress": 25
}
```

#### Get Projects (with filtering)

```bash
GET /api/users/{userId}/projects?status=active&priority=high&page=1&limit=10
```

#### Update Project

```bash
PUT /api/users/{userId}/projects/{projectId}
Content-Type: application/json

{
  "status": "completed",
  "progress": 100,
  "notes": "Project completed successfully"
}
```

#### Mark Project Complete

```bash
PATCH /api/users/{userId}/projects/{projectId}/complete
```

#### Get Project Statistics

```bash
GET /api/users/{userId}/projects/stats
```

### System Endpoints

#### Health Check

```bash
GET /api/health
```

#### System Status

```bash
GET /api/status
```

#### API Documentation

```bash
GET /api/docs
```

## 🔧 Development

### Project Structure

```
multi-tenant-app/
├── src/
│   ├── config/
│   │   └── database.js          # Database connection manager
│   ├── controllers/
│   │   ├── userController.js    # User management logic
│   │   └── projectController.js # Project CRUD operations
│   ├── models/
│   │   ├── User.js             # User schema (central database)
│   │   └── Project.js          # Project schema (per-user database)
│   ├── routes/
│   │   ├── index.js            # System routes
│   │   ├── users.js            # User routes
│   │   └── projects.js         # Project routes
│   └── server.js               # Main server file
├── package.json
├── .env
└── README.md
```

### Running Tests

```bash
# Currently no tests implemented
npm test
```

### Development Mode

```bash
# Start with auto-reload
npm run dev

# Check logs
tail -f logs/app.log  # If file logging is enabled
```

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=8080
MONGODB_BASE_URL=mongodb+srv://username:password@cluster.mongodb.net
DB_PREFIX=prod_tenant_
MAX_CONNECTIONS_PER_DB=20
CLEANUP_INACTIVE_CONNECTIONS_MINUTES=60
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=warn
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY .env ./

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t multi-tenant-app .
docker run -p 3000:3000 multi-tenant-app
```

### MongoDB Atlas Setup

1. Create MongoDB Atlas cluster
2. Create database user
3. Whitelist your IP address
4. Get connection string
5. Update `MONGODB_BASE_URL` in `.env`

Example Atlas connection string:

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net
```

### Production Considerations

1. **Security**: Implement proper authentication and authorization
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Monitoring**: Add application performance monitoring
4. **Backup**: Set up automated database backups
5. **SSL/TLS**: Use HTTPS in production
6. **Load Balancing**: Use load balancer for multiple instances
7. **Database Indexing**: Add appropriate indexes for performance

## 🔒 Security Features

### Current Implementation

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing control
- **Input Validation**: Mongoose schema validation
- **Error Handling**: No sensitive data in error responses
- **Connection Isolation**: Each user's data is completely isolated

### Production Security Checklist

- [ ] Implement JWT authentication
- [ ] Add rate limiting
- [ ] Use HTTPS/SSL certificates
- [ ] Implement API key authentication
- [ ] Add request validation middleware
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

## 📊 Monitoring

### Available Metrics

The `/api/status` endpoint provides:

- **Server Information**: Uptime, memory usage, Node.js version
- **Database Statistics**: Active connections, total users, connection health
- **User Database Information**: Per-user database status and last access times

### Example Status Response

```json
{
  "success": true,
  "data": {
    "server": {
      "uptime": 3600.123,
      "memory": {
        "rss": 45678912,
        "heapTotal": 20971520,
        "heapUsed": 18874368
      },
      "nodeVersion": "v18.17.0",
      "platform": "linux"
    },
    "database": {
      "totalConnections": 5,
      "activeConnections": 3,
      "totalUsers": 10
    },
    "activeUserDatabases": [
      {
        "userId": "abc123",
        "dbName": "tenant_abc123",
        "status": "connected",
        "lastAccessed": "2024-01-09T10:30:00.000Z",
        "models": ["Project"]
      }
    ]
  }
}
```

## 🎯 Scaling Considerations

### Horizontal Scaling

- **Stateless Design**: Application is stateless and can run multiple instances
- **Load Balancer**: Use nginx or cloud load balancer
- **Session Management**: No sessions stored in memory

### Database Scaling

- **Connection Pooling**: Configurable per-database connection limits
- **Automatic Cleanup**: Inactive connections are automatically closed
- **MongoDB Sharding**: Can implement sharding for very large deployments

### Performance Optimization

- **Indexing**: Add indexes on frequently queried fields
- **Caching**: Implement Redis for frequently accessed data
- **CDN**: Use CDN for static assets
- **Database Optimization**: Regular database maintenance and optimization

## 🐛 Troubleshooting

### Common Issues

#### Connection Errors

```bash
# Check MongoDB status
mongod --version

# Test connection
mongo mongodb://localhost:27017/test
```

#### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Memory Issues

- Check connection cleanup interval
- Monitor active connections via `/api/status`
- Reduce `MAX_CONNECTIONS_PER_DB` if needed

### Debug Mode

Set environment variable for verbose logging:

```bash
NODE_ENV=development npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Express.js** - Fast, unopinionated web framework
- **Mongoose** - MongoDB object modeling
- **MongoDB** - Document database platform

---

## 📞 Support

For support and questions:

- Create an issue in the repository
- Check the API documentation at `/api/docs`
- Review the system status at `/api/status`

**Ready to deploy!** 🚀
