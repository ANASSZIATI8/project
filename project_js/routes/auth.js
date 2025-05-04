const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin, validateRegistration } = require('../middleware/validators');
const { isGuest, isAuthenticated } = require('../middleware/auth');

// Login routes
router.get('/login', isGuest, authController.getLoginPage);
router.post('/login', isGuest, validateLogin, authController.login);

// Register routes
router.get('/register', isGuest, authController.getRegisterPage);

// Add debugging middleware for register route
router.post('/register', (req, res, next) => {
  console.log('Form submission received:');
  console.log('Body:', req.body);
  console.log('Content-Type:', req.headers['content-type']);
  next();
}, isGuest, validateRegistration, authController.register);

// Logout route
router.get('/logout', isAuthenticated, authController.logout);

module.exports = router;