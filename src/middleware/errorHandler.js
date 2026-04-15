const { HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');
const config = require('../config');

/**
 * Handle 404 - Not Found errors
 */
const notFoundHandler = (req, res, next) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = ERROR_MESSAGES.INTERNAL_ERROR;

  // Handle specific error types
  if (err.message === ERROR_MESSAGES.INVALID_CREDENTIALS) {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = err.message;
  } else if (err.message === ERROR_MESSAGES.USER_ALREADY_EXISTS) {
    statusCode = HTTP_STATUS.CONFLICT;
    message = err.message;
  } else if (err.message === ERROR_MESSAGES.USER_NOT_FOUND) {
    statusCode = HTTP_STATUS.NOT_FOUND;
    message = err.message;
  } else if (
    err.message === ERROR_MESSAGES.TOKEN_EXPIRED ||
    err.message === ERROR_MESSAGES.TOKEN_INVALID
  ) {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = err.message;
  } else if (err.message === ERROR_MESSAGES.UNAUTHORIZED) {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = err.message;
  } else if (err.message === ERROR_MESSAGES.FORBIDDEN) {
    statusCode = HTTP_STATUS.FORBIDDEN;
    message = err.message;
  }

  // Send error response
  const response = {
    success: false,
    message,
  };

  // Include stack trace in development
  if (config.env === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
