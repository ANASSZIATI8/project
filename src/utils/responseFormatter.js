/**
 * Format success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Formatted response
 */
const successResponse = (data, message = 'Success') => ({
  success: true,
  message,
  data,
});

/**
 * Format error response
 * @param {string} message - Error message
 * @param {Array} errors - Validation errors (optional)
 * @returns {Object} Formatted response
 */
const errorResponse = (message, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

/**
 * Format paginated response
 * @param {Array} data - Response data
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Formatted paginated response
 */
const paginatedResponse = (data, page, limit, total) => ({
  success: true,
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  },
});

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};
