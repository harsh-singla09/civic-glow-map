const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import database configuration
const { connectDatabase, createIndexes, seedAdminUser } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const issueRoutes = require('./routes/issues');
const adminRoutes = require('./routes/admin');

// Import middleware
const { handleUploadError } = require('./middleware/upload');
const { sendError, serverErrorResponse, sendResponse } = require('./utils/apiResponse');

// Create Express app
const app = express();

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      // Add production frontend URLs here
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    statusCode: 429,
    timestamp: new Date().toISOString()
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (for uploaded images if not using Cloudinary)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { checkDatabaseHealth, getDatabaseStats } = require('./config/database');
    
    const [dbHealth, dbStats] = await Promise.all([
      checkDatabaseHealth(),
      getDatabaseStats()
    ]);

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbHealth,
      stats: dbStats,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
app.use('/auth', authRoutes);
app.use('/issues', issueRoutes);
app.use('/admin', adminRoutes);

// API documentation endpoint
app.get('/api-docs', (req, res) => {
  res.json({
    name: 'CivicFlow API',
    version: '1.0.0',
    description: 'RESTful API for CivicFlow - Civic Issue Reporting Platform',
    endpoints: {
      authentication: {
        'POST /auth/register': 'Register a new user',
        'POST /auth/login': 'Login user',
        'GET /auth/me': 'Get current user profile',
        'PUT /auth/profile': 'Update user profile',
        'PUT /auth/change-password': 'Change user password',
        'POST /auth/logout': 'Logout user'
      },
      issues: {
        'GET /issues': 'Get all issues with filtering',
        'POST /issues': 'Create a new issue',
        'GET /issues/:id': 'Get issue by ID',
        'PUT /issues/:id/status': 'Update issue status (agent/admin)',
        'DELETE /issues/:id': 'Delete issue (admin only)',
        'POST /issues/:id/vote': 'Vote on an issue',
        'POST /issues/:id/flag': 'Flag an issue',
        'GET /issues/:id/status-log': 'Get issue status timeline'
      },
      admin: {
        'GET /admin/analytics': 'Get dashboard analytics',
        'GET /admin/users': 'Get all users',
        'PUT /admin/users/:id/ban': 'Ban/unban a user',
        'GET /admin/flags': 'Get all flags',
        'PUT /admin/flags/:id/review': 'Review a flag',
        'PUT /admin/issues/:id/visibility': 'Hide/show an issue',
        'GET /admin/health': 'Get system health',
        'GET /admin/activity': 'Get activity logs'
      }
    },
    features: [
      'JWT Authentication',
      'Role-based Authorization (citizen, agent, admin)',
      'Geospatial Issue Filtering',
      'Image Upload Support',
      'Issue Status Tracking',
      'Flagging System',
      'Admin Analytics Dashboard',
      'Rate Limiting',
      'Input Validation',
      'Error Handling'
    ]
  });
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  sendResponse(res, {
    success: false,
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString()
  });
});

// Upload error handling middleware
app.use(handleUploadError);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    
    return sendResponse(res, {
      success: false,
      message: 'Validation failed',
      errors,
      statusCode: 400,
      timestamp: new Date().toISOString()
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendResponse(res, {
      success: false,
      message: `${field} already exists`,
      statusCode: 409,
      timestamp: new Date().toISOString()
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendResponse(res, {
      success: false,
      message: 'Invalid token',
      statusCode: 401,
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return sendResponse(res, {
      success: false,
      message: 'Token expired',
      statusCode: 401,
      timestamp: new Date().toISOString()
    });
  }

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return sendResponse(res, {
      success: false,
      message: 'CORS policy violation',
      statusCode: 403,
      timestamp: new Date().toISOString()
    });
  }

  // Default server error
  const response = serverErrorResponse('Internal Server Error', err);
  sendResponse(res, response);
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Create indexes
    await createIndexes();
    
    // Seed admin user
    await seedAdminUser();
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log('🚀 Server started successfully!');
      console.log(`📱 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📋 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;