const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { sendError } = require('../utils/apiResponse');

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images
const imageFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer configuration for issue images
const uploadIssueImages = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Maximum 5 files
  }
});

// Multer configuration for single avatar upload
const uploadAvatar = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1
  }
});

/**
 * Upload images to Cloudinary
 * @param {Array} files - Array of file objects
 * @param {string} folder - Cloudinary folder name
 * @returns {Array} Array of upload results
 */
const uploadToCloudinary = async (files, folder = 'civicflow') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary configuration not found');
  }

  const uploadPromises = files.map(file => {
    return cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
        { format: 'jpg' }
      ]
    });
  });

  try {
    const results = await Promise.all(uploadPromises);
    
    // Clean up local files after successful upload
    files.forEach(file => {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting local file:', err);
      });
    });

    return results.map(result => ({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    }));
  } catch (error) {
    // Clean up local files on error
    files.forEach(file => {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting local file:', err);
      });
    });
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
const deleteFromCloudinary = async (publicId) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
};

/**
 * Middleware to handle issue image uploads
 */
const handleIssueImageUpload = (req, res, next) => {
  uploadIssueImages.array('images', 5)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'File size too large. Maximum 5MB per image.', 400);
        } else if (err.code === 'LIMIT_FILE_COUNT') {
          return sendError(res, 'Too many files. Maximum 5 images allowed.', 400);
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return sendError(res, 'Unexpected field name. Use "images" for image uploads.', 400);
        }
      }
      return sendError(res, err.message || 'Image upload failed', 400);
    }
    next();
  });
};

/**
 * Middleware to handle avatar upload
 */
const handleAvatarUpload = (req, res, next) => {
  uploadAvatar.single('avatar')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'File size too large. Maximum 2MB for avatar.', 400);
        }
      }
      return sendError(res, err.message || 'Avatar upload failed', 400);
    }
    next();
  });
};

/**
 * Middleware to process uploaded images
 * Uploads to Cloudinary if configured, otherwise keeps local files
 */
const processUploadedImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      // Upload to Cloudinary
      const uploadResults = await uploadToCloudinary(req.files, 'civicflow/issues');
      req.uploadedImages = uploadResults;
    } else {
      // Use local files
      req.uploadedImages = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        publicId: null,
        originalName: file.originalname,
        size: file.size
      }));
    }

    next();
  } catch (error) {
    console.error('Error processing uploaded images:', error);
    return sendError(res, 'Failed to process uploaded images', 500);
  }
};

/**
 * Middleware to process uploaded avatar
 */
const processUploadedAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      // Upload to Cloudinary
      const uploadResults = await uploadToCloudinary([req.file], 'civicflow/avatars');
      req.uploadedAvatar = uploadResults[0];
    } else {
      // Use local file
      req.uploadedAvatar = {
        url: `/uploads/${req.file.filename}`,
        publicId: null,
        originalName: req.file.originalname,
        size: req.file.size
      };
    }

    next();
  } catch (error) {
    console.error('Error processing uploaded avatar:', error);
    return sendError(res, 'Failed to process uploaded avatar', 500);
  }
};

/**
 * Clean up uploaded files on error
 */
const cleanupFiles = (files) => {
  if (!files) return;
  
  const fileArray = Array.isArray(files) ? files : [files];
  fileArray.forEach(file => {
    if (file && file.path) {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
  });
};

/**
 * Error handling middleware for uploads
 */
const handleUploadError = (err, req, res, next) => {
  // Clean up any uploaded files
  if (req.files) {
    cleanupFiles(req.files);
  }
  if (req.file) {
    cleanupFiles(req.file);
  }

  next(err);
};

module.exports = {
  handleIssueImageUpload,
  handleAvatarUpload,
  processUploadedImages,
  processUploadedAvatar,
  uploadToCloudinary,
  deleteFromCloudinary,
  cleanupFiles,
  handleUploadError
};