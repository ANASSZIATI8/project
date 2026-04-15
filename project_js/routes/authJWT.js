// routes/authJWT.js - JWT Authentication Routes
const express = require('express');
const router = express.Router();
const authControllerJWT = require('../controllers/authControllerJWT');
const { isAuthenticated, isGuest } = require('../middleware/authJWT');
const { validateLogin, validateRegistration } = require('../middleware/validators');
const rateLimit = require('express-rate-limit');

// Rate limiter for auth routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many authentication attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/login', authLimiter, validateLogin, authControllerJWT.login);
router.post('/register', authLimiter, validateRegistration, authControllerJWT.register);
router.post('/refresh', authControllerJWT.refreshToken);

// Protected routes (require authentication)
router.post('/logout', isAuthenticated, authControllerJWT.logout);
router.get('/me', isAuthenticated, authControllerJWT.getCurrentUser);
router.get('/verify', isAuthenticated, authControllerJWT.verifyToken);

module.exports = router;
