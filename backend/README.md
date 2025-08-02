# CivicFlow Backend API

A complete Node.js + Express backend for CivicFlow, a civic issue reporting platform. This RESTful API provides comprehensive functionality for user authentication, issue management, geospatial filtering, image uploads, flagging system, and admin analytics.

## 🚀 Features

- **JWT Authentication** - Secure user authentication with role-based access control
- **User Roles** - Support for Citizens, Agents, and Admins
- **Issue Management** - Full CRUD operations for civic issues
- **Geospatial Filtering** - MongoDB geospatial queries for location-based issue filtering
- **Image Upload** - Multer + Cloudinary integration for issue photos
- **Status Tracking** - Automatic status log creation for issue timeline
- **Flagging System** - Community moderation with auto-hide functionality
- **Admin Dashboard** - Comprehensive analytics and moderation tools
- **Rate Limiting** - Protection against abuse
- **Input Validation** - Express-validator for request validation
- **Error Handling** - Consistent error responses
- **CORS Support** - Cross-origin resource sharing configuration

## 📋 Prerequisites

- **Node.js** (v16.0.0 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd civicflow-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configurations:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/civicflow
   
   # JWT Secret (IMPORTANT: Change in production!)
   JWT_SECRET=your_super_secret_jwt_key_here
   
   # Server
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   
   # Admin User
   ADMIN_EMAIL=admin@civicflow.com
   ADMIN_PASSWORD=secure_admin_password
   
   # Optional: Cloudinary for image uploads
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000` and automatically:
- Connect to MongoDB
- Create database indexes
- Seed the default admin user

## 📚 API Documentation

### Base URL
```
http://localhost:5000
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "citizen",
  "longitude": -74.006,
  "latitude": 40.7128
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /auth/me
Authorization: Bearer <jwt_token>
```

#### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

{
  "name": "John Smith",
  "phone": "+1234567890",
  "longitude": -74.006,
  "latitude": 40.7128,
  "avatar": <file>
}
```

### Issue Endpoints

#### Get Issues (with filtering)
```http
GET /issues?page=1&limit=10&category=Road%20%26%20Transportation&status=Reported&lat=40.7128&lng=-74.006&distance=5&search=pothole
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `category` - Issue category
- `status` - Issue status (Reported, In Progress, Resolved, Closed)
- `priority` - Issue priority (Low, Medium, High, Critical)
- `lat`, `lng` - Geolocation for proximity filtering
- `distance` - Distance in kilometers (default: 5)
- `search` - Text search in title/description
- `tags` - Comma-separated tags
- `sort` - Sort field (default: -createdAt)

#### Create Issue
```http
POST /issues
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

{
  "title": "Pothole on Main Street",
  "description": "Large pothole causing traffic issues",
  "category": "Road & Transportation",
  "longitude": -74.006,
  "latitude": 40.7128,
  "address": "123 Main Street",
  "landmark": "Near City Hall",
  "priority": "High",
  "tags": ["pothole", "traffic"],
  "images": [<file1>, <file2>]
}
```

#### Get Issue Details
```http
GET /issues/:id
```

#### Update Issue Status (Agent/Admin only)
```http
PUT /issues/:id/status
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "In Progress",
  "comment": "Work has begun on this issue",
  "estimatedResolutionDate": "2024-02-15T10:00:00Z",
  "assignedTo": "agent_user_id"
}
```

#### Vote on Issue
```http
POST /issues/:id/vote
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "action": "upvote"  // or "remove"
}
```

#### Flag Issue
```http
POST /issues/:id/flag
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "reason": "Inappropriate Content",
  "description": "This issue contains offensive language"
}
```

#### Get Issue Timeline
```http
GET /issues/:id/status-log
```

### Admin Endpoints

#### Get Analytics Dashboard
```http
GET /admin/analytics?period=30d
Authorization: Bearer <admin_jwt_token>
```

#### Get All Users
```http
GET /admin/users?page=1&limit=10&role=citizen&search=john
Authorization: Bearer <admin_jwt_token>
```

#### Ban/Unban User
```http
PUT /admin/users/:id/ban
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "isBanned": true,
  "banReason": "Repeated violations of community guidelines"
}
```

#### Get Flags for Review
```http
GET /admin/flags?status=Pending&page=1&limit=10
Authorization: Bearer <admin_jwt_token>
```

#### Review Flag
```http
PUT /admin/flags/:id/review
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "status": "Reviewed",
  "reviewNotes": "Flag is valid, taking action",
  "actionTaken": "Issue Hidden"
}
```

### System Endpoints

#### Health Check
```http
GET /health
```

#### API Documentation
```http
GET /api-docs
```

## 🏗️ Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection & configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── issueController.js   # Issue management logic
│   └── adminController.js   # Admin & analytics logic
├── middleware/
│   ├── auth.js             # JWT & authorization middleware
│   └── upload.js           # File upload middleware
├── models/
│   ├── User.js             # User schema
│   ├── Issue.js            # Issue schema
│   ├── StatusLog.js        # Status tracking schema
│   └── Flag.js             # Flagging schema
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── issues.js           # Issue routes
│   └── admin.js            # Admin routes
├── utils/
│   ├── apiResponse.js      # Consistent API responses
│   └── distance.js         # Geospatial utilities
├── uploads/                # Local file storage (if not using Cloudinary)
├── .env                    # Environment variables
├── .env.example           # Environment template
├── server.js              # Main server file
└── package.json           # Dependencies & scripts
```

## 🔐 Authentication & Authorization

The API uses JWT tokens for authentication with three user roles:

1. **Citizen** - Can create issues, vote, flag, view public content
2. **Agent** - Can update issue status, assign issues, view all content
3. **Admin** - Full access including user management, analytics, moderation

### Token Usage
Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 🌍 Geospatial Features

The API supports location-based filtering using MongoDB's geospatial capabilities:

- **Proximity Search** - Find issues within a specified distance
- **Bounding Box** - Search within geographical boundaries
- **Geo-clustering** - Analytics for most reported areas

Example proximity search:
```http
GET /issues?lat=40.7128&lng=-74.006&distance=5
```

## 📸 Image Upload

Images can be uploaded either to:

1. **Local Storage** - Files stored in `/uploads` directory
2. **Cloudinary** - Cloud storage (recommended for production)

To enable Cloudinary, add these environment variables:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🚨 Flagging System

The community moderation system includes:

- Citizens can flag inappropriate issues
- Auto-hide issues with 5+ flags
- Admin review workflow
- Action tracking (warnings, bans, content removal)

## 📊 Admin Analytics

The admin dashboard provides:

- Total users, issues, flags overview
- Issues by status, category, priority
- Geographic clustering of issues
- Resolution time statistics
- User activity trends
- Top reported zones

## 🛡️ Security Features

- **Helmet.js** - Security headers
- **Rate Limiting** - Prevents abuse
- **CORS** - Controlled cross-origin access
- **Input Validation** - Express-validator
- **Password Hashing** - bcryptjs
- **JWT Security** - Configurable expiration

## 🚀 Deployment

### Environment Variables
For production, ensure these are properly configured:

```env
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
MONGODB_URI=<production-mongodb-url>
FRONTEND_URL=<production-frontend-url>
```

### MongoDB Setup
1. **Local MongoDB**:
   ```bash
   sudo apt install mongodb
   sudo systemctl start mongodb
   ```

2. **MongoDB Atlas** (recommended):
   - Create account at mongodb.com
   - Create cluster and get connection string
   - Update `MONGODB_URI` in `.env`

### Cloudinary Setup (Optional)
1. Sign up at cloudinary.com
2. Get cloud name, API key, and secret
3. Add to `.env` file

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### PM2 Deployment
```bash
npm install -g pm2
pm2 start server.js --name "civicflow-api"
pm2 startup
pm2 save
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Check API health
curl http://localhost:5000/health

# Verify endpoints
curl http://localhost:5000/api-docs
```

## 📝 API Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...},
  "statusCode": 200,
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [...],
  "statusCode": 400,
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "statusCode": 200,
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation at `/api-docs`
- Monitor health status at `/health`
- Review server logs for debugging

## 🔧 Common Issues

### MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### JWT Token Issues
- Ensure `JWT_SECRET` is set in `.env`
- Check token expiration settings
- Verify Authorization header format

---

**CivicFlow Backend** - Empowering communities through technology 🌟