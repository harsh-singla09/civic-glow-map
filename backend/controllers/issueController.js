const { validationResult } = require('express-validator');
const Issue = require('../models/Issue');
const StatusLog = require('../models/StatusLog');
const Flag = require('../models/Flag');
const { 
  sendSuccess, 
  sendError, 
  sendPaginated,
  validationErrorResponse,
  notFoundResponse,
  authorizationErrorResponse,
  sendResponse 
} = require('../utils/apiResponse');
const { createNearbyQuery, isValidCoordinates } = require('../utils/distance');

/**
 * Create a new issue
 * POST /issues
 */
const createIssue = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, validationErrorResponse(errors.array()));
    }

    const {
      title,
      description,
      category,
      longitude,
      latitude,
      address,
      landmark,
      priority = 'Medium',
      tags
    } = req.body;

    // Validate coordinates
    if (!isValidCoordinates(longitude, latitude)) {
      return sendError(res, 'Invalid coordinates provided', 400);
    }

    // Prepare issue data
    const issueData = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      createdBy: req.user._id,
      metadata: {
        source: req.body.source || 'web',
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    };

    // Add optional fields
    if (address) issueData.address = address.trim();
    if (landmark) issueData.landmark = landmark.trim();
    if (tags && Array.isArray(tags)) {
      issueData.tags = tags.map(tag => tag.toString().toLowerCase().trim());
    }

    // Add images if uploaded
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      issueData.images = req.uploadedImages.map(img => ({
        url: img.url,
        publicId: img.publicId,
        caption: img.caption || ''
      }));
    }

    // Create issue
    const issue = new Issue(issueData);
    await issue.save();

    // Create initial status log
    await StatusLog.createStatusLog(
      issue._id,
      'Reported',
      req.user._id,
      {
        comment: 'Issue reported',
        isSystemGenerated: true,
        metadata: issueData.metadata
      }
    );

    // Populate creator information
    await issue.populate('createdBy', 'name email role avatar');

    const responseData = {
      issue: {
        id: issue._id,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        status: issue.status,
        priority: issue.priority,
        location: issue.location,
        address: issue.address,
        landmark: issue.landmark,
        images: issue.images,
        tags: issue.tags,
        upvotes: issue.upvotes,
        flagCount: issue.flagCount,
        createdBy: issue.createdBy,
        createdAt: issue.createdAt
      }
    };

    sendSuccess(res, responseData, 'Issue created successfully', 201);
  } catch (error) {
    console.error('Create issue error:', error);
    
    if (error.name === 'ValidationError') {
      return sendResponse(res, validationErrorResponse(error));
    }
    
    sendError(res, 'Failed to create issue', 500, error.message);
  }
};

/**
 * Get all issues with filtering and pagination
 * GET /issues
 */
const getIssues = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      priority,
      lat,
      lng,
      distance = 5, // kilometers
      sort = '-createdAt',
      search,
      tags,
      includeHidden = false
    } = req.query;

    // Build query
    const query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      query.tags = { $in: tagArray };
    }

    // Hide issues unless admin or includeHidden is true
    if (!includeHidden || (req.user && req.user.role !== 'admin')) {
      query.isHidden = false;
    }

    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { landmark: { $regex: search, $options: 'i' } }
      ];
    }

    // Geospatial filtering
    let issuesQuery;
    if (lat && lng && isValidCoordinates(parseFloat(lng), parseFloat(lat))) {
      const geoQuery = createNearbyQuery(parseFloat(lng), parseFloat(lat), parseFloat(distance));
      issuesQuery = Issue.find({ ...query, ...geoQuery });
    } else {
      issuesQuery = Issue.find(query);
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
    const [issues, totalCount] = await Promise.all([
      issuesQuery
        .populate('createdBy', 'name email role avatar')
        .populate('assignedTo', 'name email role')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Issue.countDocuments(lat && lng ? { ...query, ...createNearbyQuery(parseFloat(lng), parseFloat(lat), parseFloat(distance)) } : query)
    ]);

    // Format response data
    const formattedIssues = issues.map(issue => ({
      id: issue._id,
      title: issue.title,
      description: issue.description,
      category: issue.category,
      status: issue.status,
      priority: issue.priority,
      location: issue.location,
      address: issue.address,
      landmark: issue.landmark,
      images: issue.images,
      tags: issue.tags,
      upvotes: issue.upvotes,
      flagCount: issue.flagCount,
      createdBy: issue.createdBy,
      assignedTo: issue.assignedTo,
      estimatedResolutionDate: issue.estimatedResolutionDate,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      // Add distance if geospatial query was used
      ...(lat && lng && {
        distance: issue.distanceFrom(parseFloat(lng), parseFloat(lat))
      })
    }));

    sendPaginated(res, formattedIssues, page, limit, totalCount, 'Issues retrieved successfully');
  } catch (error) {
    console.error('Get issues error:', error);
    sendError(res, 'Failed to retrieve issues', 500, error.message);
  }
};

/**
 * Get a single issue by ID
 * GET /issues/:id
 */
const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;

    const issue = await Issue.findById(id)
      .populate('createdBy', 'name email role avatar phone')
      .populate('assignedTo', 'name email role');

    if (!issue) {
      return sendResponse(res, notFoundResponse('Issue'));
    }

    // Check if user can view hidden issues
    if (issue.isHidden && (!req.user || req.user.role === 'citizen')) {
      return sendResponse(res, notFoundResponse('Issue'));
    }

    // Get status logs
    const statusLogs = await StatusLog.getIssueTimeline(issue._id);

    // Check if current user has upvoted
    const hasUpvoted = req.user ? issue.upvotedBy.includes(req.user._id) : false;

    // Check if current user has flagged
    let hasFlagged = false;
    if (req.user) {
      hasFlagged = await Flag.hasUserFlagged(issue._id, req.user._id);
    }

    const responseData = {
      issue: {
        id: issue._id,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        status: issue.status,
        priority: issue.priority,
        location: issue.location,
        address: issue.address,
        landmark: issue.landmark,
        images: issue.images,
        tags: issue.tags,
        upvotes: issue.upvotes,
        flagCount: issue.flagCount,
        createdBy: issue.createdBy,
        assignedTo: issue.assignedTo,
        estimatedResolutionDate: issue.estimatedResolutionDate,
        actualResolutionDate: issue.actualResolutionDate,
        isHidden: issue.isHidden,
        hiddenReason: issue.hiddenReason,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        hasUpvoted,
        hasFlagged
      },
      statusLogs: statusLogs.map(log => ({
        id: log._id,
        status: log.status,
        previousStatus: log.previousStatus,
        comment: log.comment,
        updatedBy: log.updatedBy,
        isSystemGenerated: log.isSystemGenerated,
        createdAt: log.createdAt
      }))
    };

    sendSuccess(res, responseData, 'Issue retrieved successfully');
  } catch (error) {
    console.error('Get issue error:', error);
    sendError(res, 'Failed to retrieve issue', 500, error.message);
  }
};

/**
 * Update issue status (agents and admins only)
 * PUT /issues/:id/status
 */
const updateIssueStatus = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, validationErrorResponse(errors.array()));
    }

    const { id } = req.params;
    const { status, comment, estimatedResolutionDate, assignedTo } = req.body;

    const issue = await Issue.findById(id);
    if (!issue) {
      return sendResponse(res, notFoundResponse('Issue'));
    }

    const previousStatus = issue.status;

    // Update issue
    const updateData = { status };
    
    if (estimatedResolutionDate) {
      updateData.estimatedResolutionDate = new Date(estimatedResolutionDate);
    }
    
    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    // Set actual resolution date if status is Resolved or Closed
    if ((status === 'Resolved' || status === 'Closed') && !issue.actualResolutionDate) {
      updateData.actualResolutionDate = new Date();
    }

    Object.assign(issue, updateData);
    await issue.save();

    // Create status log
    await StatusLog.createStatusLog(
      issue._id,
      status,
      req.user._id,
      {
        previousStatus,
        comment,
        estimatedResolutionDate: updateData.estimatedResolutionDate,
        metadata: {
          source: req.body.source || 'web',
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        }
      }
    );

    // Populate updated issue
    await issue.populate('createdBy', 'name email role')
                .populate('assignedTo', 'name email role');

    const responseData = {
      issue: {
        id: issue._id,
        status: issue.status,
        assignedTo: issue.assignedTo,
        estimatedResolutionDate: issue.estimatedResolutionDate,
        actualResolutionDate: issue.actualResolutionDate,
        updatedAt: issue.updatedAt
      }
    };

    sendSuccess(res, responseData, 'Issue status updated successfully');
  } catch (error) {
    console.error('Update issue status error:', error);
    
    if (error.name === 'ValidationError') {
      return sendResponse(res, validationErrorResponse(error));
    }
    
    sendError(res, 'Failed to update issue status', 500, error.message);
  }
};

/**
 * Delete an issue (admin only)
 * DELETE /issues/:id
 */
const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;

    const issue = await Issue.findById(id);
    if (!issue) {
      return sendResponse(res, notFoundResponse('Issue'));
    }

    // Delete related data
    await Promise.all([
      StatusLog.deleteMany({ issueId: id }),
      Flag.deleteMany({ issueId: id })
    ]);

    // Delete images from Cloudinary if applicable
    if (issue.images && issue.images.length > 0) {
      const { deleteFromCloudinary } = require('../middleware/upload');
      
      for (const image of issue.images) {
        if (image.publicId) {
          await deleteFromCloudinary(image.publicId);
        }
      }
    }

    // Delete issue
    await Issue.findByIdAndDelete(id);

    sendSuccess(res, null, 'Issue deleted successfully');
  } catch (error) {
    console.error('Delete issue error:', error);
    sendError(res, 'Failed to delete issue', 500, error.message);
  }
};

/**
 * Upvote/downvote an issue
 * POST /issues/:id/vote
 */
const voteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'upvote' or 'remove'

    const issue = await Issue.findById(id);
    if (!issue) {
      return sendResponse(res, notFoundResponse('Issue'));
    }

    if (issue.isHidden) {
      return sendError(res, 'Cannot vote on hidden issues', 400);
    }

    let message;
    if (action === 'upvote') {
      const added = issue.addUpvote(req.user._id);
      message = added ? 'Issue upvoted successfully' : 'You have already upvoted this issue';
    } else if (action === 'remove') {
      const removed = issue.removeUpvote(req.user._id);
      message = removed ? 'Upvote removed successfully' : 'You have not upvoted this issue';
    } else {
      return sendError(res, 'Invalid action. Use "upvote" or "remove"', 400);
    }

    await issue.save();

    const responseData = {
      upvotes: issue.upvotes,
      hasUpvoted: issue.upvotedBy.includes(req.user._id)
    };

    sendSuccess(res, responseData, message);
  } catch (error) {
    console.error('Vote issue error:', error);
    sendError(res, 'Failed to process vote', 500, error.message);
  }
};

/**
 * Flag an issue
 * POST /issues/:id/flag
 */
const flagIssue = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, validationErrorResponse(errors.array()));
    }

    const { id } = req.params;
    const { reason, description } = req.body;

    const issue = await Issue.findById(id);
    if (!issue) {
      return sendResponse(res, notFoundResponse('Issue'));
    }

    // Check if user has already flagged this issue
    const hasAlreadyFlagged = await Flag.hasUserFlagged(id, req.user._id);
    if (hasAlreadyFlagged) {
      return sendError(res, 'You have already flagged this issue', 400);
    }

    // Create flag
    const flag = new Flag({
      issueId: id,
      flaggedBy: req.user._id,
      reason,
      description: description.trim(),
      metadata: {
        source: req.body.source || 'web',
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    await flag.save();

    sendSuccess(res, null, 'Issue flagged successfully');
  } catch (error) {
    console.error('Flag issue error:', error);
    
    if (error.name === 'ValidationError') {
      return sendResponse(res, validationErrorResponse(error));
    }
    
    sendError(res, 'Failed to flag issue', 500, error.message);
  }
};

/**
 * Get issue status timeline
 * GET /issues/:id/status-log
 */
const getIssueStatusLog = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if issue exists
    const issue = await Issue.findById(id);
    if (!issue) {
      return sendResponse(res, notFoundResponse('Issue'));
    }

    // Check if user can view the issue
    if (issue.isHidden && (!req.user || req.user.role === 'citizen')) {
      return sendResponse(res, notFoundResponse('Issue'));
    }

    const statusLogs = await StatusLog.getIssueTimeline(id);

    const responseData = statusLogs.map(log => ({
      id: log._id,
      status: log.status,
      previousStatus: log.previousStatus,
      comment: log.comment,
      estimatedResolutionDate: log.estimatedResolutionDate,
      updatedBy: {
        id: log.updatedBy._id,
        name: log.updatedBy.name,
        role: log.updatedBy.role
      },
      isSystemGenerated: log.isSystemGenerated,
      createdAt: log.createdAt
    }));

    sendSuccess(res, responseData, 'Status timeline retrieved successfully');
  } catch (error) {
    console.error('Get status log error:', error);
    sendError(res, 'Failed to retrieve status timeline', 500, error.message);
  }
};

module.exports = {
  createIssue,
  getIssues,
  getIssueById,
  updateIssueStatus,
  deleteIssue,
  voteIssue,
  flagIssue,
  getIssueStatusLog
};