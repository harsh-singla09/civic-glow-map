const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const {
  sendSuccess,
  sendError,
  validationErrorResponse,
  conflictResponse,
  authErrorResponse,
  notFoundResponse,
  sendResponse
} = require('../utils/apiResponse');

/**
 * Register a new user
 * POST /auth/register
 */
const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, validationErrorResponse(errors.array()));
    }

    const { name, email, password, phone, role = 'citizen' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendResponse(res, conflictResponse('User with this email already exists'));
    }

    // Validate role (only admin can create admin/agent accounts)
    if (role !== 'citizen' && (!req.user || req.user.role !== 'admin')) {
      return sendError(res, 'Only administrators can create agent or admin accounts', 403);
    }

    // Create new user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      phone: phone?.trim()
    };

    // Set location if provided
    if (req.body.longitude && req.body.latitude) {
      userData.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
    }

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Update last login
    await user.updateLastLogin();

    // Prepare response data
    const responseData = {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    };

    sendSuccess(res, responseData, 'User registered successfully', 201);
  } catch (error) {
    console.error('Registration error:', error);
    sendError(res, 'Registration failed', 500, error.message);
  }
};

/**
 * Login user
 * POST /auth/login
 */
const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, validationErrorResponse(errors.array()));
    }

    const { email, password } = req.body;

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return sendResponse(res, authErrorResponse('Invalid email or password'));
    }

    // Check if user is banned
    if (user.isBannedUser()) {
      return sendResponse(res, authErrorResponse(
        `Account is banned. Reason: ${user.banReason || 'No reason provided'}`
      ));
    }

    // Check if user is active
    if (!user.isActive) {
      return sendResponse(res, authErrorResponse('Account is inactive'));
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return sendResponse(res, authErrorResponse('Invalid email or password'));
    }

    // Generate token
    const token = generateToken(user);

    // Update last login
    await user.updateLastLogin();

    // Prepare response data (exclude password)
    const responseData = {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    };

    sendSuccess(res, responseData, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Login failed', 500, error.message);
  }
};

/**
 * Get current user profile
 * GET /auth/me
 */
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    // Get additional user stats
    const Issue = require('../models/Issue');
    const issueStats = await Issue.aggregate([
      { $match: { createdBy: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalIssues = await Issue.countDocuments({ createdBy: user._id });

    const responseData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        location: user.location,
        createdAt: user.createdAt
      },
      stats: {
        totalIssues,
        issuesByStatus: issueStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    };

    sendSuccess(res, responseData, 'Profile retrieved successfully');
  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 'Failed to retrieve profile', 500, error.message);
  }
};

/**
 * Update user profile
 * PUT /auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, validationErrorResponse(errors.array()));
    }

    const userId = req.user._id;
    const { name, phone, longitude, latitude } = req.body;

    // Prepare update data
    const updateData = {};
    
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone?.trim();
    
    // Handle avatar upload
    if (req.uploadedAvatar) {
      updateData.avatar = req.uploadedAvatar.url;
    }

    // Handle location update
    if (longitude !== undefined && latitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return sendResponse(res, notFoundResponse('User'));
    }

    const responseData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        location: user.location,
        updatedAt: user.updatedAt
      }
    };

    sendSuccess(res, responseData, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      return sendResponse(res, validationErrorResponse(error));
    }
    
    sendError(res, 'Failed to update profile', 500, error.message);
  }
};

/**
 * Change password
 * PUT /auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, validationErrorResponse(errors.array()));
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return sendResponse(res, notFoundResponse('User'));
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return sendResponse(res, authErrorResponse('Current password is incorrect'));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    sendError(res, 'Failed to change password', 500, error.message);
  }
};

/**
 * Logout user (client-side token removal)
 * POST /auth/logout
 */
const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is mainly handled client-side
    // Here we just send a success response
    // In future, could implement token blacklisting if needed
    
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    sendError(res, 'Logout failed', 500, error.message);
  }
};

/**
 * Get user by ID (admin only)
 * GET /auth/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return sendResponse(res, notFoundResponse('User'));
    }

    // Get user stats if requested
    const includeStats = req.query.includeStats === 'true';
    let stats = {};

    if (includeStats) {
      const Issue = require('../models/Issue');
      const Flag = require('../models/Flag');

      const [issueStats, flagStats, totalIssues, totalFlags] = await Promise.all([
        Issue.aggregate([
          { $match: { createdBy: user._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Flag.aggregate([
          { $match: { flaggedBy: user._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Issue.countDocuments({ createdBy: user._id }),
        Flag.countDocuments({ flaggedBy: user._id })
      ]);

      stats = {
        totalIssues,
        totalFlags,
        issuesByStatus: issueStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        flagsByStatus: flagStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      };
    }

    const responseData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
        isBanned: user.isBanned,
        banReason: user.banReason,
        bannedAt: user.bannedAt,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      ...(includeStats && { stats })
    };

    sendSuccess(res, responseData, 'User retrieved successfully');
  } catch (error) {
    console.error('Get user error:', error);
    sendError(res, 'Failed to retrieve user', 500, error.message);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  getUserById
};