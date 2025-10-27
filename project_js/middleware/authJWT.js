// middleware/authJWT.js
const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwtUtils');
const { sendError } = require('../utils/responseHandler');

/**
 * Extract JWT token from request
 * Checks both cookies and Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null
 */
const extractToken = (req) => {
  // Check cookies first
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader) {
    return extractTokenFromHeader(authHeader);
  }

  return null;
};

/**
 * Middleware to check if user is authenticated
 * Verifies JWT token and attaches user data to req.user
 */
const isAuthenticated = (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return sendError(res, 401, 'Authentication required');
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded; // Attach user data to request
    next();
  } catch (error) {
    return sendError(res, 401, 'Invalid or expired token');
  }
};

/**
 * Middleware to check if user is a student
 */
const isStudent = (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return sendError(res, 401, 'Authentication required');
    }

    const decoded = verifyAccessToken(token);

    if (decoded.role !== 'student') {
      return sendError(res, 403, 'Access denied. Students only.');
    }

    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 401, 'Invalid or expired token');
  }
};

/**
 * Middleware to check if user is a teacher
 */
const isTeacher = (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return sendError(res, 401, 'Authentication required');
    }

    const decoded = verifyAccessToken(token);

    if (decoded.role !== 'teacher') {
      return sendError(res, 403, 'Access denied. Teachers only.');
    }

    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 401, 'Invalid or expired token');
  }
};

/**
 * Optional authentication middleware
 * Attaches user data if token exists, but doesn't require authentication
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }
  } catch (error) {
    // Token is invalid, but we don't fail the request
    // Just continue without user data
  }

  next();
};

/**
 * Middleware to check if user is a guest (not authenticated)
 * Used for login/register pages
 */
const isGuest = (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyAccessToken(token);

      // User is already logged in
      return sendError(res, 400, 'Already authenticated');
    }

    next();
  } catch (error) {
    // Token is invalid or expired, user is a guest
    next();
  }
};

module.exports = {
  isAuthenticated,
  isStudent,
  isTeacher,
  optionalAuth,
  isGuest
};
