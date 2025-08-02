/**
 * Utility functions for consistent API responses
 */

/**
 * Success response format
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted success response
 */
function successResponse(data = null, message = 'Success', statusCode = 200) {
  return {
    success: true,
    message,
    data,
    statusCode,
    timestamp: new Date().toISOString()
  };
}

/**
 * Error response format
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Detailed error information
 * @returns {Object} Formatted error response
 */
function errorResponse(message = 'Internal Server Error', statusCode = 500, errors = null) {
  return {
    success: false,
    message,
    errors,
    statusCode,
    timestamp: new Date().toISOString()
  };
}

/**
 * Paginated response format
 * @param {Array} data - Response data array
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Success message
 * @returns {Object} Formatted paginated response
 */
function paginatedResponse(data, page, limit, total, message = 'Success') {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    },
    statusCode: 200,
    timestamp: new Date().toISOString()
  };
}

/**
 * Validation error response
 * @param {Array|Object} validationErrors - Array of validation errors
 * @returns {Object} Formatted validation error response
 */
function validationErrorResponse(validationErrors) {
  let formattedErrors = [];
  
  if (Array.isArray(validationErrors)) {
    formattedErrors = validationErrors.map(error => ({
      field: error.param || error.path,
      message: error.msg || error.message,
      value: error.value
    }));
  } else if (validationErrors.errors) {
    // Mongoose validation errors
    formattedErrors = Object.keys(validationErrors.errors).map(key => ({
      field: key,
      message: validationErrors.errors[key].message,
      value: validationErrors.errors[key].value
    }));
  } else {
    formattedErrors = [validationErrors];
  }

  return {
    success: false,
    message: 'Validation failed',
    errors: formattedErrors,
    statusCode: 400,
    timestamp: new Date().toISOString()
  };
}

/**
 * Authentication error response
 * @param {string} message - Authentication error message
 * @returns {Object} Formatted authentication error response
 */
function authErrorResponse(message = 'Authentication failed') {
  return errorResponse(message, 401);
}

/**
 * Authorization error response
 * @param {string} message - Authorization error message
 * @returns {Object} Formatted authorization error response
 */
function authorizationErrorResponse(message = 'Access denied. Insufficient permissions.') {
  return errorResponse(message, 403);
}

/**
 * Not found error response
 * @param {string} resource - Name of the resource not found
 * @returns {Object} Formatted not found error response
 */
function notFoundResponse(resource = 'Resource') {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * Conflict error response
 * @param {string} message - Conflict error message
 * @returns {Object} Formatted conflict error response
 */
function conflictResponse(message = 'Resource already exists') {
  return errorResponse(message, 409);
}

/**
 * Rate limit error response
 * @param {string} message - Rate limit message
 * @param {Object} rateLimit - Rate limit information
 * @returns {Object} Formatted rate limit error response
 */
function rateLimitResponse(message = 'Too many requests', rateLimit = {}) {
  return {
    success: false,
    message,
    rateLimit,
    statusCode: 429,
    timestamp: new Date().toISOString()
  };
}

/**
 * Server error response
 * @param {string} message - Server error message
 * @param {*} error - Error object (only included in development)
 * @returns {Object} Formatted server error response
 */
function serverErrorResponse(message = 'Internal Server Error', error = null) {
  const response = errorResponse(message, 500);
  
  // Only include error details in development
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = {
      stack: error.stack,
      details: error.message
    };
  }
  
  return response;
}

/**
 * Send JSON response with proper status code
 * @param {Object} res - Express response object
 * @param {Object} responseData - Response data object
 */
function sendResponse(res, responseData) {
  return res.status(responseData.statusCode).json(responseData);
}

/**
 * Create success response and send it
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  const response = successResponse(data, message, statusCode);
  return sendResponse(res, response);
}

/**
 * Create error response and send it
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Detailed error information
 */
function sendError(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
  const response = errorResponse(message, statusCode, errors);
  return sendResponse(res, response);
}

/**
 * Create paginated response and send it
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Success message
 */
function sendPaginated(res, data, page, limit, total, message = 'Success') {
  const response = paginatedResponse(data, page, limit, total, message);
  return sendResponse(res, response);
}

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  validationErrorResponse,
  authErrorResponse,
  authorizationErrorResponse,
  notFoundResponse,
  conflictResponse,
  rateLimitResponse,
  serverErrorResponse,
  sendResponse,
  sendSuccess,
  sendError,
  sendPaginated
};