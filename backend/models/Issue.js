const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
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
    ]
  },
  status: {
    type: String,
    enum: ['Reported', 'In Progress', 'Resolved', 'Closed'],
    default: 'Reported'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required']
    }
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  landmark: {
    type: String,
    trim: true,
    maxlength: [200, 'Landmark cannot exceed 200 characters']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String, // For Cloudinary
      default: null
    },
    caption: {
      type: String,
      maxlength: [100, 'Image caption cannot exceed 100 characters']
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  estimatedResolutionDate: {
    type: Date,
    default: null
  },
  actualResolutionDate: {
    type: Date,
    default: null
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  hiddenReason: {
    type: String,
    default: null
  },
  hiddenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  flagCount: {
    type: Number,
    default: 0
  },
  upvotes: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    },
    userAgent: String,
    ipAddress: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based queries
issueSchema.index({ location: '2dsphere' });

// Compound indexes for common queries
issueSchema.index({ status: 1, category: 1 });
issueSchema.index({ createdBy: 1, status: 1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ flagCount: -1 });
issueSchema.index({ isHidden: 1, status: 1 });

// Virtual for status logs
issueSchema.virtual('statusLogs', {
  ref: 'StatusLog',
  localField: '_id',
  foreignField: 'issueId'
});

// Virtual for flags
issueSchema.virtual('flags', {
  ref: 'Flag',
  localField: '_id',
  foreignField: 'issueId'
});

// Pre-save middleware to validate image limit
issueSchema.pre('save', function(next) {
  if (this.images && this.images.length > 5) {
    return next(new Error('Maximum 5 images allowed per issue'));
  }
  next();
});

// Method to check if issue should be auto-hidden
issueSchema.methods.checkAutoHide = function() {
  if (this.flagCount >= 5 && !this.isHidden) {
    this.isHidden = true;
    this.hiddenReason = 'Auto-hidden due to multiple flags';
    return true;
  }
  return false;
};

// Method to add upvote
issueSchema.methods.addUpvote = function(userId) {
  if (!this.upvotedBy.includes(userId)) {
    this.upvotedBy.push(userId);
    this.upvotes += 1;
    return true;
  }
  return false;
};

// Method to remove upvote
issueSchema.methods.removeUpvote = function(userId) {
  const index = this.upvotedBy.indexOf(userId);
  if (index > -1) {
    this.upvotedBy.splice(index, 1);
    this.upvotes -= 1;
    return true;
  }
  return false;
};

// Method to calculate distance from a point
issueSchema.methods.distanceFrom = function(longitude, latitude) {
  const [issueLng, issueLat] = this.location.coordinates;
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = (issueLat - latitude) * Math.PI / 180;
  const dLng = (issueLng - longitude) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(latitude * Math.PI / 180) * Math.cos(issueLat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

// Static method for geo-based queries
issueSchema.statics.findNearby = function(longitude, latitude, maxDistance = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    }
  });
};

module.exports = mongoose.model('Issue', issueSchema);