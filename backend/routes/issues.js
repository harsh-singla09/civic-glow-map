const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const issueController = require('../controllers/issueController');
const { 
  authenticate, 
  optionalAuthenticate, 
  requireAgent, 
  requireAdmin 
} = require('../middleware/auth');
const { 
  handleIssueImageUpload, 
  processUploadedImages 
} = require('../middleware/upload');

// Validation rules
const createIssueValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .isIn([
      'Road & Transportation',
      'Water & Sanitation',
      'Electricity',
      'Waste Management',
      'Public Safety',
      'Parks & Recreation',
      'Street Lighting',
      'Public Health',
      'Noise Pollution',
      'Air Pollution',
      'Building & Construction',
      'Other'
    ])
    .withMessage('Invalid category'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('landmark')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Landmark cannot exceed 200 characters'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
];

const updateStatusValidation = [
  body('status')
    .isIn(['Reported', 'In Progress', 'Resolved', 'Closed'])
    .withMessage('Invalid status'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  body('estimatedResolutionDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID')
];

const voteValidation = [
  body('action')
    .isIn(['upvote', 'remove'])
    .withMessage('Action must be either "upvote" or "remove"')
];

const flagValidation = [
  body('reason')
    .isIn([
      'Inappropriate Content',
      'Spam',
      'False Information',
      'Offensive Language',
      'Duplicate Issue',
      'Not a Valid Issue',
      'Personal Attack',
      'Off Topic',
      'Other'
    ])
    .withMessage('Invalid flag reason'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters')
];

const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid issue ID')
];

// Public routes (with optional authentication)
router.get('/', optionalAuthenticate, issueController.getIssues);
router.get('/:id', mongoIdValidation, optionalAuthenticate, issueController.getIssueById);
router.get('/:id/status-log', mongoIdValidation, optionalAuthenticate, issueController.getIssueStatusLog);

// Protected routes (require authentication)
router.post('/', 
  authenticate,
  handleIssueImageUpload,
  processUploadedImages,
  createIssueValidation,
  issueController.createIssue
);

router.post('/:id/vote', 
  mongoIdValidation,
  authenticate,
  voteValidation,
  issueController.voteIssue
);

router.post('/:id/flag', 
  mongoIdValidation,
  authenticate,
  flagValidation,
  issueController.flagIssue
);

// Agent/Admin routes
router.put('/:id/status', 
  mongoIdValidation,
  requireAgent,
  updateStatusValidation,
  issueController.updateIssueStatus
);

// Admin only routes
router.delete('/:id', 
  mongoIdValidation,
  requireAdmin,
  issueController.deleteIssue
);

module.exports = router;