# Todo App Backend API

A secure and scalable RESTful API for the daily todo application with JWT authentication, task management, and AI-powered motivational summaries.

## Features

- 🔐 **JWT Authentication** with refresh tokens
- 📝 **Task Management** with CRUD operations
- 🤖 **AI-Powered Motivational Summaries** using OpenAI
- 📊 **Task History & Statistics**
- 🛡️ **Security Features** (rate limiting, input validation, CORS)
- 📈 **Productivity Insights** and analytics
- 🔄 **Bulk Operations** for tasks
- 📱 **RESTful API** with consistent responses

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **OpenAI** - AI-powered summaries
- **Joi** - Input validation
- **Winston** - Logging
- **Helmet** - Security headers
- **Rate Limiting** - API protection

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- OpenAI API key (for AI features)

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/todo_app

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_SECRET=your-refresh-token-secret
   JWT_REFRESH_EXPIRES_IN=7d

   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_MODEL=gpt-3.5-turbo

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # CORS
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication

| Method | Endpoint                    | Description             | Auth Required |
| ------ | --------------------------- | ----------------------- | ------------- |
| POST   | `/api/auth/register`        | Register new user       | No            |
| POST   | `/api/auth/login`           | Login user              | No            |
| POST   | `/api/auth/refresh`         | Refresh JWT token       | No            |
| GET    | `/api/auth/me`              | Get current user        | Yes           |
| PUT    | `/api/auth/profile`         | Update user profile     | Yes           |
| PUT    | `/api/auth/change-password` | Change password         | Yes           |
| POST   | `/api/auth/logout`          | Logout user             | Yes           |
| POST   | `/api/auth/logout-all`      | Logout from all devices | Yes           |

### Tasks

| Method | Endpoint                  | Description                  | Auth Required |
| ------ | ------------------------- | ---------------------------- | ------------- |
| GET    | `/api/tasks/today`        | Get today's tasks            | Yes           |
| GET    | `/api/tasks`              | Get all tasks with filtering | Yes           |
| GET    | `/api/tasks/:id`          | Get single task              | Yes           |
| POST   | `/api/tasks`              | Create new task              | Yes           |
| PUT    | `/api/tasks/:id`          | Update task                  | Yes           |
| PATCH  | `/api/tasks/:id/complete` | Mark task as complete        | Yes           |
| PATCH  | `/api/tasks/:id/restore`  | Restore task                 | Yes           |
| DELETE | `/api/tasks/:id`          | Delete task                  | Yes           |
| GET    | `/api/tasks/history`      | Get task history             | Yes           |
| GET    | `/api/tasks/stats`        | Get task statistics          | Yes           |
| PATCH  | `/api/tasks/bulk`         | Bulk update tasks            | Yes           |
| DELETE | `/api/tasks/bulk`         | Bulk delete tasks            | Yes           |

### Motivational Summaries

| Method | Endpoint                | Description               | Auth Required |
| ------ | ----------------------- | ------------------------- | ------------- |
| GET    | `/api/summary`          | Get motivational summary  | Yes           |
| GET    | `/api/summary/weekly`   | Get weekly summary        | Yes           |
| GET    | `/api/summary/insights` | Get productivity insights | Yes           |

## API Usage Examples

### Authentication

**Register a new user:**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Tasks

**Create a new task:**

```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive documentation for the new feature",
    "priority": "high",
    "dueDate": "2024-01-15T18:00:00.000Z",
    "tags": ["documentation", "project"],
    "estimatedTime": 120
  }'
```

**Get today's tasks:**

```bash
curl -X GET http://localhost:5000/api/tasks/today \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Mark task as complete:**

```bash
curl -X PATCH http://localhost:5000/api/tasks/TASK_ID/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Motivational Summary

**Get AI-powered motivational summary:**

```bash
curl -X GET http://localhost:5000/api/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "error": true,
  "message": "Error description",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## Security Features

- **JWT Authentication** with refresh tokens
- **Password Hashing** using bcrypt
- **Input Validation** and sanitization
- **Rate Limiting** to prevent abuse
- **CORS Protection** for cross-origin requests
- **Security Headers** with Helmet
- **Request Logging** for monitoring

## Environment Variables

| Variable                  | Description               | Default                            |
| ------------------------- | ------------------------- | ---------------------------------- |
| `PORT`                    | Server port               | 5000                               |
| `NODE_ENV`                | Environment mode          | development                        |
| `MONGODB_URI`             | MongoDB connection string | mongodb://localhost:27017/todo_app |
| `JWT_SECRET`              | JWT signing secret        | Required                           |
| `JWT_EXPIRES_IN`          | JWT expiration time       | 24h                                |
| `JWT_REFRESH_SECRET`      | Refresh token secret      | Required                           |
| `JWT_REFRESH_EXPIRES_IN`  | Refresh token expiration  | 7d                                 |
| `OPENAI_API_KEY`          | OpenAI API key            | Required                           |
| `OPENAI_MODEL`            | OpenAI model to use       | gpt-3.5-turbo                      |
| `RATE_LIMIT_WINDOW_MS`    | Rate limit window         | 900000 (15 min)                    |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window   | 100                                |
| `CORS_ORIGIN`             | Allowed CORS origin       | http://localhost:3000              |

## Development

### Scripts

```bash
# Start development server with nodemon
npm run dev

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Project Structure

```
src/
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── taskController.js    # Task management logic
│   └── summaryController.js # Motivational summaries
├── middleware/
│   ├── authMiddleware.js    # JWT authentication
│   ├── errorHandler.js      # Error handling
│   ├── requestLogger.js     # Request logging
│   └── validationMiddleware.js # Input validation
├── models/
│   ├── User.js             # User model
│   └── Task.js             # Task model
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── tasks.js            # Task routes
│   └── summary.js          # Summary routes
├── utils/
│   └── logger.js           # Winston logger
└── server.js               # Main server file
```

## Testing

The API includes comprehensive error handling and validation. Test the endpoints using tools like:

- **Postman** - API testing
- **curl** - Command line testing
- **Jest** - Unit testing (configured)

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Configure MongoDB Atlas or production database
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Use HTTPS in production
- [ ] Set up environment variables securely

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please open an issue in the repository.
