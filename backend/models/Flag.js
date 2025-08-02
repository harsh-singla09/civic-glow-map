const mongoose = require('mongoose');

const flagSchema = new mongoose.Schema({
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: [true, 'Issue ID is required']
  },
  flaggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Flagged by user is required']
  },
  reason: {
    type: String,
    required: [true, 'Flag reason is required'],
    enum: [
      'Inappropriate Content',
      'Spam',
      'False Information',
      'Offensive Language',
      'Duplicate Issue',
      'Not a Valid Issue',
      'Personal Attack',
      'Off Topic',
      'Other'
    ]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    required: [true, 'Flag description is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Dismissed', 'Approved'],
    default: 'Pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Review notes cannot exceed 1000 characters']
  },
  actionTaken: {
    type: String,
    enum: [
      'No Action',
      'Issue Hidden',
      'Issue Deleted', 
      'User Warned',
      'User Banned',
      'Content Modified',
      'Other'
    ],
    default: null
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
flagSchema.index({ issueId: 1, flaggedBy: 1 }, { unique: true }); // Prevent duplicate flags by same user
flagSchema.index({ issueId: 1, createdAt: -1 });
flagSchema.index({ flaggedBy: 1 });
flagSchema.index({ status: 1, createdAt: -1 });
flagSchema.index({ reviewedBy: 1 });
flagSchema.index({ priority: 1, status: 1 });

// Virtual to populate issue details
flagSchema.virtual('issue', {
  ref: 'Issue',
  localField: 'issueId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate flagged by user details
flagSchema.virtual('flaggedByUser', {
  ref: 'User',
  localField: 'flaggedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate reviewed by user details
flagSchema.virtual('reviewedByUser', {
  ref: 'User',
  localField: 'reviewedBy',
  foreignField: '_id',
  justOne: true
});

// Static method to check if user has already flagged an issue
flagSchema.statics.hasUserFlagged = async function(issueId, userId) {
  const flag = await this.findOne({ issueId, flaggedBy: userId });
  return !!flag;
};

// Static method to get flags for an issue
flagSchema.statics.getIssueFlags = function(issueId) {
  return this.find({ issueId })
    .populate('flaggedBy', 'name email')
    .populate('reviewedBy', 'name email role')
    .sort({ createdAt: -1 });
};

// Static method to get pending flags for admin review
flagSchema.statics.getPendingFlags = function(limit = 50) {
  return this.find({ status: 'Pending' })
    .populate('issueId', 'title category status')
    .populate('flaggedBy', 'name email')
    .sort({ priority: -1, createdAt: 1 })
    .limit(limit);
};

// Static method to get flags statistics
flagSchema.statics.getFlagStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const reasonStats = await this.aggregate([
    {
      $group: {
        _id: '$reason',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  return {
    byStatus: stats,
    byReason: reasonStats
  };
};

// Method to mark flag as reviewed
flagSchema.methods.markAsReviewed = function(reviewedBy, reviewNotes, actionTaken, status = 'Reviewed') {
  this.status = status;
  this.reviewedBy = reviewedBy;
  this.reviewedAt = new Date();
  this.reviewNotes = reviewNotes;
  this.actionTaken = actionTaken;
  return this.save();
};

// Method to format for API response
flagSchema.methods.toAPIResponse = function() {
  return {
    id: this._id,
    issueId: this.issueId,
    flaggedBy: this.flaggedBy,
    reason: this.reason,
    description: this.description,
    status: this.status,
    reviewedBy: this.reviewedBy,
    reviewedAt: this.reviewedAt,
    reviewNotes: this.reviewNotes,
    actionTaken: this.actionTaken,
    priority: this.priority,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Pre-save middleware to update issue flag count
flagSchema.post('save', async function() {
  if (this.isNew) {
    const Issue = mongoose.model('Issue');
    await Issue.findByIdAndUpdate(
      this.issueId,
      { $inc: { flagCount: 1 } }
    );
    
    // Check if issue should be auto-hidden
    const issue = await Issue.findById(this.issueId);
    if (issue) {
      issue.checkAutoHide();
      await issue.save();
    }
  }
});

// Pre-remove middleware to update issue flag count
flagSchema.pre('remove', async function() {
  const Issue = mongoose.model('Issue');
  await Issue.findByIdAndUpdate(
    this.issueId,
    { $inc: { flagCount: -1 } }
  );
});

module.exports = mongoose.model('Flag', flagSchema);