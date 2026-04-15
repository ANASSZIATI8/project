const authService = require('../services/authService');
const User = require('../models/user');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * Middleware to verify JWT token and attach user to request
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED,
    });
  }

  const token = authHeader.substring(7);

  // Verify token
  const decoded = authService.verifyToken(token);

  // Get user from token
  const user = await User.findById(decoded.id);

  if (!user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.USER_NOT_FOUND,
    });
  }

  // Attach user to request
  req.user = user;
  next();
});

/**
 * Optional authentication - attach user if token is provided but don't fail if not
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyToken(token);
      const user = await User.findById(decoded.id);

      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
});

module.exports = {
  authenticate,
  optionalAuth,
};
