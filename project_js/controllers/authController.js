const User = require('../models/user');
const { validationResult } = require('express-validator');

/**
 * Auth Controller - Handles authentication logic
 */
const authController = {
  /**
   * Render login page
   */
  getLoginPage: (req, res) => {
    res.render('login', { 
      title: 'Login - Online Examination System',
      errorMessage: req.flash('error'),
      successMessage: req.flash('success'),
      formData: req.flash('formData')[0] || {}
    });
  },

  /**
   * Render registration page
   */
  getRegisterPage: (req, res) => {
    res.render('register', { 
      title: 'Register - Online Examination System',
      errorMessage: req.flash('error'),
      formData: req.flash('formData')[0] || {}
    });
  },

  /**
   * Process login form submission
   */
  login: async (req, res) => {
    try {
      // Extract form data
      const { email, password, remember } = req.body;
      
      // Validation errors check (from express-validator middleware)
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        req.flash('formData', { email, remember });
        return res.redirect('/login');
      }

      // Find user by email
      const user = await User.findOne({ email });
      
      // User not found
      if (!user) {
        req.flash('error', 'Invalid email or password');
        req.flash('formData', { email, remember });
        return res.redirect('/login');
      }

      // Compare passwords
      const isMatch = await user.comparePassword(password);
      
      // Password doesn't match
      if (!isMatch) {
        req.flash('error', 'Invalid email or password');
        req.flash('formData', { email, remember });
        return res.redirect('/login');
      }

      // Authentication successful - create session
      req.session.user = {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      };

      // Remember me functionality
      if (remember) {
        // 30 days in milliseconds
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
      }

      // Redirect based on role
      const redirectPath = user.role === 'student' 
        ? '/student/dashboard' 
        : '/teacher/dashboard';
        
      return res.redirect(redirectPath);

    } catch (error) {
      console.error('Login error:', error);
      req.flash('error', 'An error occurred during login');
      return res.redirect('/login');
    }
  },

  /**
   * Process registration form submission
   */
  register: async (req, res) => {
    try {
      // Extract form data
      const { fullName, email, password, confirmPassword, role, terms } = req.body;
      
      // Validation errors check (from express-validator middleware)
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        req.flash('formData', { fullName, email, role });
        return res.redirect('/register');
      }

      // Custom validation
      if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match');
        req.flash('formData', { fullName, email, role });
        return res.redirect('/register');
      }

      if (!terms) {
        req.flash('error', 'You must agree to the Terms of Service');
        req.flash('formData', { fullName, email, role });
        return res.redirect('/register');
      }

      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        req.flash('error', 'Email is already registered');
        req.flash('formData', { fullName, role });
        return res.redirect('/register');
      }

      // Create new user
      await User.create({
        fullName,
        email,
        password,
        role: role || 'student'
      });

      // Success message
      req.flash('success', 'Registration successful! Please login.');
      return res.redirect('/login');

    } catch (error) {
      console.error('Registration error:', error);
      req.flash('error', 'An error occurred during registration');
      return res.redirect('/register');
    }
  },

  /**
   * Process user logout
   */
  logout: (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect('/login');
    });
  }
};

module.exports = authController;