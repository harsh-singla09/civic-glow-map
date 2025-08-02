const mongoose = require('mongoose');

const statusLogSchema = new mongoose.Schema({
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: [true, 'Issue ID is required']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Reported', 'In Progress', 'Resolved', 'Closed']
  },
  previousStatus: {
    type: String,
    enum: ['Reported', 'In Progress', 'Resolved', 'Closed'],
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Updated by user is required']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  estimatedResolutionDate: {
    type: Date,
    default: null
  },
  attachments: [{
    url: String,
    filename: String,
    type: {
      type: String,
      enum: ['image', 'document', 'other'],
      default: 'other'
    }
  }],
  isSystemGenerated: {
    type: Boolean,
    default: false
  },
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api', 'system'],
      default: 'web'
    },
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
statusLogSchema.index({ issueId: 1, createdAt: -1 });
statusLogSchema.index({ updatedBy: 1 });
statusLogSchema.index({ status: 1, createdAt: -1 });
statusLogSchema.index({ createdAt: -1 });

// Virtual to populate issue details
statusLogSchema.virtual('issue', {
  ref: 'Issue',
  localField: 'issueId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate user details
statusLogSchema.virtual('updatedByUser', {
  ref: 'User',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true
});

// Static method to create a status log entry
statusLogSchema.statics.createStatusLog = async function(issueId, status, updatedBy, options = {}) {
  const {
    previousStatus = null,
    comment = null,
    estimatedResolutionDate = null,
    attachments = [],
    isSystemGenerated = false,
    metadata = {}
  } = options;

  const statusLog = new this({
    issueId,
    status,
    previousStatus,
    updatedBy,
    comment,
    estimatedResolutionDate,
    attachments,
    isSystemGenerated,
    metadata
  });

  return await statusLog.save();
};

// Static method to get status timeline for an issue
statusLogSchema.statics.getIssueTimeline = function(issueId) {
  return this.find({ issueId })
    .populate('updatedBy', 'name email role')
    .sort({ createdAt: 1 });
};

// Static method to get recent status updates
statusLogSchema.statics.getRecentUpdates = function(limit = 10) {
  return this.find()
    .populate('issueId', 'title category')
    .populate('updatedBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Method to format for API response
statusLogSchema.methods.toAPIResponse = function() {
  return {
    id: this._id,
    issueId: this.issueId,
    status: this.status,
    previousStatus: this.previousStatus,
    updatedBy: this.updatedBy,
    comment: this.comment,
    estimatedResolutionDate: this.estimatedResolutionDate,
    attachments: this.attachments,
    isSystemGenerated: this.isSystemGenerated,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('StatusLog', statusLogSchema);