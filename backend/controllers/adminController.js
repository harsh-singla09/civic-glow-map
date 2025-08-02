const { validationResult } = require('express-validator');
const User = require('../models/User');
const Issue = require('../models/Issue');
const Flag = require('../models/Flag');
const StatusLog = require('../models/StatusLog');
const {
  sendSuccess,
  sendError,
  sendPaginated,
  validationErrorResponse,
  notFoundResponse,
  sendResponse
} = require('../utils/apiResponse');

/**
 * Get admin dashboard analytics
 * GET /admin/analytics
 */
const getAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Run analytics queries in parallel
    const [
      totalUsers,
      totalIssues,
      totalFlags,
      activeUsers,
      issuesByStatus,
      issuesByCategory,
      issuesByPriority,
      flagsByReason,
      recentIssues,
      topReportedZones,
      usersByRole,
      issuesTrend,
      resolutionStats
    ] = await Promise.all([
      // Total counts
      User.countDocuments(),
      Issue.countDocuments(),
      Flag.countDocuments(),
      
      // Active users (logged in within last 30 days)
      User.countDocuments({ 
        lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),

      // Issues by status
      Issue.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Issues by category
      Issue.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Issues by priority
      Issue.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),

      // Flags by reason
      Flag.aggregate([
        { $group: { _id: '$reason', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Recent issues
      Issue.find()
        .populate('createdBy', 'name email role')
        .sort({ createdAt: -1 })
        .limit(10),

      // Top 3 reported zones (geo clustering)
      Issue.aggregate([
        {
          $group: {
            _id: {
              // Round coordinates to create zones (approximately 1km precision)
              lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 2] },
              lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 2] }
            },
            count: { $sum: 1 },
            issues: { $push: '$_id' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ]),

      // Users by role
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),

      // Issues trend (last 30 days)
      Issue.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),

      // Resolution statistics
      Issue.aggregate([
        {
          $match: {
            status: { $in: ['Resolved', 'Closed'] },
            actualResolutionDate: { $ne: null },
            createdAt: { $ne: null }
          }
        },
        {
          $project: {
            resolutionTime: {
              $divide: [
                { $subtract: ['$actualResolutionDate', '$createdAt'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgResolutionTime: { $avg: '$resolutionTime' },
            minResolutionTime: { $min: '$resolutionTime' },
            maxResolutionTime: { $max: '$resolutionTime' },
            totalResolved: { $sum: 1 }
          }
        }
      ])
    ]);

    // Format the response
    const responseData = {
      overview: {
        totalUsers,
        totalIssues,
        totalFlags,
        activeUsers,
        period
      },
      issues: {
        byStatus: issuesByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byCategory: issuesByCategory,
        byPriority: issuesByPriority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        trend: issuesTrend
      },
      flags: {
        byReason: flagsByReason
      },
      users: {
        byRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      topReportedZones: topReportedZones.map(zone => ({
        coordinates: [zone._id.lng, zone._id.lat],
        issueCount: zone.count,
        area: `${zone._id.lat}, ${zone._id.lng}`
      })),
      resolutionStats: resolutionStats[0] || {
        avgResolutionTime: 0,
        minResolutionTime: 0,
        maxResolutionTime: 0,
        totalResolved: 0
      },
      recentIssues: recentIssues.map(issue => ({
        id: issue._id,
        title: issue.title,
        category: issue.category,
        status: issue.status,
        priority: issue.priority,
        createdBy: issue.createdBy,
        createdAt: issue.createdAt
      }))
    };

    sendSuccess(res, responseData, 'Analytics retrieved successfully');
  } catch (error) {
    console.error('Analytics error:', error);
    sendError(res, 'Failed to retrieve analytics', 500, error.message);
  }
};

/**
 * Get all users with filtering and pagination
 * GET /admin/users
 */
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      isBanned,
      search,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = {};
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isBanned !== undefined) query.isBanned = isBanned === 'true';
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    const sortOptions = {};
    if (sort.startsWith('-')) {
      sortOptions[sort.substring(1)] = -1;
    } else {
      sortOptions[sort] = 1;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    // Get user stats
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const [issueCount, flagCount] = await Promise.all([
        Issue.countDocuments({ createdBy: user._id }),
        Flag.countDocuments({ flaggedBy: user._id })
      ]);

      return {
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
        createdAt: user.createdAt,
        stats: {
          issueCount,
          flagCount
        }
      };
    }));

    sendPaginated(res, usersWithStats, page, limit, totalCount, 'Users retrieved successfully');
  } catch (error) {
    console.error('Get users error:', error);
    sendError(res, 'Failed to retrieve users', 500, error.message);
  }
};

/**
 * Ban/unban a user
 * PUT /admin/users/:id/ban
 */
const banUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, validationErrorResponse(errors.array()));
    }

    const { id } = req.params;
    const { isBanned, banReason } = req.body;

    if (id === req.user._id.toString()) {
      return sendError(res, 'You cannot ban yourself', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return sendResponse(res, notFoundResponse('User'));
    }

    // Update ban status
    const updateData = {
      isBanned,
      banReason: isBanned ? banReason : null,
      bannedAt: isBanned ? new Date() : null,
      bannedBy: isBanned ? req.user._id : null
    };

    Object.assign(user, updateData);
    await user.save();

    const responseData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBanned: user.isBanned,
        banReason: user.banReason,
        bannedAt: user.bannedAt,
        updatedAt: user.updatedAt
      }
    };

    const message = isBanned ? 'User banned successfully' : 'User unbanned successfully';
    sendSuccess(res, responseData, message);
  } catch (error) {
    console.error('Ban user error:', error);
    sendError(res, 'Failed to update user ban status', 500, error.message);
  }
};

/**
 * Get all flags with filtering and pagination
 * GET /admin/flags
 */
const getFlags = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      reason,
      priority,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (reason) query.reason = reason;
    if (priority) query.priority = priority;

    // Sorting
    const sortOptions = {};
    if (sort.startsWith('-')) {
      sortOptions[sort.substring(1)] = -1;
    } else {
      sortOptions[sort] = 1;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [flags, totalCount] = await Promise.all([
      Flag.find(query)
        .populate('issueId', 'title category status')
        .populate('flaggedBy', 'name email role')
        .populate('reviewedBy', 'name email role')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Flag.countDocuments(query)
    ]);

    const formattedFlags = flags.map(flag => ({
      id: flag._id,
      issue: {
        id: flag.issueId._id,
        title: flag.issueId.title,
        category: flag.issueId.category,
        status: flag.issueId.status
      },
      flaggedBy: flag.flaggedBy,
      reason: flag.reason,
      description: flag.description,
      status: flag.status,
      priority: flag.priority,
      reviewedBy: flag.reviewedBy,
      reviewedAt: flag.reviewedAt,
      reviewNotes: flag.reviewNotes,
      actionTaken: flag.actionTaken,
      createdAt: flag.createdAt
    }));

    sendPaginated(res, formattedFlags, page, limit, totalCount, 'Flags retrieved successfully');
  } catch (error) {
    console.error('Get flags error:', error);
    sendError(res, 'Failed to retrieve flags', 500, error.message);
  }
};

/**
 * Review a flag
 * PUT /admin/flags/:id/review
 */
const reviewFlag = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, validationErrorResponse(errors.array()));
    }

    const { id } = req.params;
    const { status, reviewNotes, actionTaken } = req.body;

    const flag = await Flag.findById(id).populate('issueId');
    if (!flag) {
      return sendResponse(res, notFoundResponse('Flag'));
    }

    // Update flag
    await flag.markAsReviewed(req.user._id, reviewNotes, actionTaken, status);

    // Apply action to issue if needed
    if (actionTaken === 'Issue Hidden' && flag.issueId) {
      flag.issueId.isHidden = true;
      flag.issueId.hiddenReason = 'Hidden due to flag review';
      flag.issueId.hiddenBy = req.user._id;
      await flag.issueId.save();
    }

    const responseData = {
      flag: {
        id: flag._id,
        status: flag.status,
        reviewedBy: req.user._id,
        reviewedAt: flag.reviewedAt,
        reviewNotes: flag.reviewNotes,
        actionTaken: flag.actionTaken
      }
    };

    sendSuccess(res, responseData, 'Flag reviewed successfully');
  } catch (error) {
    console.error('Review flag error:', error);
    sendError(res, 'Failed to review flag', 500, error.message);
  }
};

/**
 * Hide/unhide an issue
 * PUT /admin/issues/:id/visibility
 */
const toggleIssueVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { isHidden, hiddenReason } = req.body;

    const issue = await Issue.findById(id);
    if (!issue) {
      return sendResponse(res, notFoundResponse('Issue'));
    }

    // Update visibility
    issue.isHidden = isHidden;
    issue.hiddenReason = isHidden ? hiddenReason : null;
    issue.hiddenBy = isHidden ? req.user._id : null;
    
    await issue.save();

    const responseData = {
      issue: {
        id: issue._id,
        isHidden: issue.isHidden,
        hiddenReason: issue.hiddenReason,
        updatedAt: issue.updatedAt
      }
    };

    const message = isHidden ? 'Issue hidden successfully' : 'Issue made visible successfully';
    sendSuccess(res, responseData, message);
  } catch (error) {
    console.error('Toggle issue visibility error:', error);
    sendError(res, 'Failed to update issue visibility', 500, error.message);
  }
};

/**
 * Get system health metrics
 * GET /admin/health
 */
const getSystemHealth = async (req, res) => {
  try {
    const [
      dbStatus,
      recentErrors,
      performanceStats
    ] = await Promise.all([
      // Database connection status
      new Promise(resolve => {
        const mongoose = require('mongoose');
        resolve({
          connected: mongoose.connection.readyState === 1,
          status: mongoose.connection.readyState
        });
      }),

      // Recent error logs (if logging is implemented)
      Promise.resolve([]), // Placeholder for error logs

      // Performance statistics
      Issue.aggregate([
        {
          $group: {
            _id: null,
            totalIssues: { $sum: 1 },
            avgUpvotes: { $avg: '$upvotes' },
            avgFlagCount: { $avg: '$flagCount' }
          }
        }
      ])
    ]);

    const responseData = {
      database: dbStatus,
      errors: recentErrors,
      performance: performanceStats[0] || {},
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date()
    };

    sendSuccess(res, responseData, 'System health retrieved successfully');
  } catch (error) {
    console.error('System health error:', error);
    sendError(res, 'Failed to retrieve system health', 500, error.message);
  }
};

/**
 * Get recent activity logs
 * GET /admin/activity
 */
const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Get recent status logs as activity indicators
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, totalCount] = await Promise.all([
      StatusLog.find()
        .populate('issueId', 'title category')
        .populate('updatedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      StatusLog.countDocuments()
    ]);

    const formattedLogs = logs.map(log => ({
      id: log._id,
      action: `Issue status changed to ${log.status}`,
      issue: log.issueId,
      user: log.updatedBy,
      comment: log.comment,
      isSystemGenerated: log.isSystemGenerated,
      createdAt: log.createdAt
    }));

    sendPaginated(res, formattedLogs, page, limit, totalCount, 'Activity logs retrieved successfully');
  } catch (error) {
    console.error('Activity logs error:', error);
    sendError(res, 'Failed to retrieve activity logs', 500, error.message);
  }
};

module.exports = {
  getAnalytics,
  getUsers,
  banUser,
  getFlags,
  reviewFlag,
  toggleIssueVisibility,
  getSystemHealth,
  getActivityLogs
};