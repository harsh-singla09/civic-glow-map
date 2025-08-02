const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authErrorResponse, authorizationErrorResponse, sendResponse } = require('../utils/apiResponse');

/**
 * Verify JWT token and authenticate user
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return sendResponse(res, authErrorResponse('Access token required'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID from token
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return sendResponse(res, authErrorResponse('User not found'));
    }

    // Check if user is banned
    if (user.isBannedUser()) {
      return sendResponse(res, authErrorResponse('User account is banned'));
    }

    // Check if user is active
    if (!user.isActive) {
      return sendResponse(res, authErrorResponse('User account is inactive'));
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return sendResponse(res, authErrorResponse('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      return sendResponse(res, authErrorResponse('Token expired'));
    }
    
    return sendResponse(res, authErrorResponse('Authentication failed'));
  }
};

/**
 * Optional authentication - sets user if token is provided
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && !user.isBannedUser() && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // In optional auth, continue without user if token is invalid
    next();
  }
};

/**
 * Check if user has required role(s)
 * @param {string|Array} roles - Required role(s)
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendResponse(res, authErrorResponse('Authentication required'));
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return sendResponse(res, authorizationErrorResponse(
        `Access denied. Required role: ${allowedRoles.join(' or ')}`
      ));
    }

    next();
  };
};

/**
 * Check if user is admin
 */
const requireAdmin = authorize(['admin']);

/**
 * Check if user is agent or admin
 */
const requireAgent = authorize(['agent', 'admin']);

/**
 * Check if user is citizen, agent, or admin (any authenticated user)
 */
const requireAuth = authenticate;

/**
 * Check if user owns the resource or has admin/agent privileges
 * @param {string} resourceUserField - Field name containing the user ID in the resource
 */
const requireOwnershipOrAgent = (resourceUserField = 'createdBy') => {
  return (req, res, next) => {
    if (!req.user) {
      return sendResponse(res, authErrorResponse('Authentication required'));
    }

    const userRole = req.user.role;
    const userId = req.user._id.toString();

    // Admin and agent have access to all resources
    if (userRole === 'admin' || userRole === 'agent') {
      return next();
    }

    // For citizens, check ownership
    const resourceUserId = req.resource?.[resourceUserField]?.toString() || 
                          req.body?.[resourceUserField]?.toString() ||
                          req.params?.userId;

    if (resourceUserId && resourceUserId === userId) {
      return next();
    }

    return sendResponse(res, authorizationErrorResponse(
      'Access denied. You can only access your own resources.'
    ));
  };
};

/**
 * Check if user can modify the resource (owner, agent, or admin)
 */
const canModifyResource = (resourceUserField = 'createdBy') => {
  return async (req, res, next) => {
    if (!req.user) {
      return sendResponse(res, authErrorResponse('Authentication required'));
    }

    const userRole = req.user.role;
    const userId = req.user._id.toString();

    // Admin has full access
    if (userRole === 'admin') {
      return next();
    }

    // Agent can modify certain fields
    if (userRole === 'agent') {
      req.isAgent = true;
      return next();
    }

    // Citizens can only modify their own resources
    const resourceUserId = req.resource?.[resourceUserField]?.toString();
    
    if (resourceUserId && resourceUserId === userId) {
      req.isOwner = true;
      return next();
    }

    return sendResponse(res, authorizationErrorResponse(
      'Access denied. Insufficient permissions to modify this resource.'
    ));
  };
};

/**
 * Rate limiting by user
 */
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    const userRequestTimes = userRequests.get(userId) || [];
    const validRequests = userRequestTimes.filter(time => time > windowStart);

    if (validRequests.length >= maxRequests) {
      return sendResponse(res, {
        success: false,
        message: 'Too many requests from this user',
        statusCode: 429,
        rateLimit: {
          maxRequests,
          windowMs,
          remainingRequests: 0,
          resetTime: new Date(validRequests[0] + windowMs)
        },
        timestamp: new Date().toISOString()
      });
    }

    // Add current request
    validRequests.push(now);
    userRequests.set(userId, validRequests);

    // Add rate limit info to response headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': maxRequests - validRequests.length,
      'X-RateLimit-Reset': new Date(now + windowMs)
    });

    next();
  };
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * Verify token without middleware (utility function)
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
  requireAdmin,
  requireAgent,
  requireAuth,
  requireOwnershipOrAgent,
  canModifyResource,
  userRateLimit,
  generateToken,
  verifyToken
};