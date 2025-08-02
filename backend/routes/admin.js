const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

// Validation rules
const banUserValidation = [
  body('isBanned')
    .isBoolean()
    .withMessage('isBanned must be a boolean'),
  body('banReason')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Ban reason must be between 1 and 500 characters')
];

const reviewFlagValidation = [
  body('status')
    .isIn(['Reviewed', 'Dismissed', 'Approved'])
    .withMessage('Invalid flag status'),
  body('reviewNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Review notes cannot exceed 1000 characters'),
  body('actionTaken')
    .isIn([
      'No Action',
      'Issue Hidden',
      'Issue Deleted',
      'User Warned',
      'User Banned',
      'Content Modified',
      'Other'
    ])
    .withMessage('Invalid action taken')
];

const toggleVisibilityValidation = [
  body('isHidden')
    .isBoolean()
    .withMessage('isHidden must be a boolean'),
  body('hiddenReason')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Hidden reason must be between 1 and 500 characters')
];

const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID')
];

// All admin routes require admin authentication
router.use(requireAdmin);

// Analytics and reporting
router.get('/analytics', adminController.getAnalytics);
router.get('/health', adminController.getSystemHealth);
router.get('/activity', adminController.getActivityLogs);

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:id/ban', 
  mongoIdValidation,
  banUserValidation,
  adminController.banUser
);

// Flag management
router.get('/flags', adminController.getFlags);
router.put('/flags/:id/review', 
  mongoIdValidation,
  reviewFlagValidation,
  adminController.reviewFlag
);

// Issue moderation
router.put('/issues/:id/visibility', 
  mongoIdValidation,
  toggleVisibilityValidation,
  adminController.toggleIssueVisibility
);

module.exports = router;