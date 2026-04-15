// controllers/authControllerJWT.js
const User = require('../models/user');
const { validationResult } = require('express-validator');
const { generateTokens, setTokenCookies, clearTokenCookies, verifyRefreshToken } = require('../utils/jwtUtils');
const { sendSuccess, sendError, sendCreated } = require('../utils/responseHandler');

/**
 * Auth Controller with JWT - Handles authentication logic
 */
const authControllerJWT = {
  /**
   * Process login - returns JWT tokens
   * POST /api/auth/login
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return sendError(res, 400, 'Email and password are required');
      }

      // Find user by email
      const user = await User.findOne({ email });

      // Check if user exists and password matches
      if (!user || !(await user.comparePassword(password))) {
        return sendError(res, 401, 'Invalid email or password');
      }

      // Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Set tokens in httpOnly cookies
      setTokenCookies(res, accessToken, refreshToken);

      // Return success with user data and tokens
      sendSuccess(res, 200, 'Login successful', {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          nom: user.nom,
          prenom: user.prenom,
          etablissement: user.etablissement,
          filiere: user.filiere
        },
        accessToken, // Also return in body for flexibility
        refreshToken
      });
    } catch (error) {
      console.error('Login error:', error);
      sendError(res, 500, 'An error occurred during login');
    }
  },

  /**
   * Process registration - creates user and returns JWT tokens
   * POST /api/auth/register
   */
  register: async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 400, errors.array()[0].msg, errors.array());
      }

      const {
        nom,
        prenom,
        dateNaissance,
        sexe,
        etablissement,
        filiere,
        email,
        password,
        confirmPassword,
        typeUtilisateur
      } = req.body;

      // Password confirmation check
      if (password !== confirmPassword) {
        return sendError(res, 400, 'Passwords do not match');
      }

      // Map typeUtilisateur to role
      const role = typeUtilisateur === 'enseignant' ? 'teacher' : 'student';

      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return sendError(res, 409, 'Email is already registered');
      }

      // Create new user
      const user = new User({
        nom,
        prenom,
        dateNaissance,
        sexe,
        etablissement,
        institution: etablissement,
        filiere,
        email,
        password,
        role
      });

      await user.save();

      // Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Set tokens in httpOnly cookies
      setTokenCookies(res, accessToken, refreshToken);

      // Return success with user data
      sendCreated(res, 'Registration successful', {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          nom: user.nom,
          prenom: user.prenom,
          etablissement: user.etablissement,
          filiere: user.filiere
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error('Registration error:', error);
      sendError(res, 500, 'An error occurred during registration');
    }
  },

  /**
   * Process logout - clears JWT tokens
   * POST /api/auth/logout
   */
  logout: (req, res) => {
    try {
      // Clear token cookies
      clearTokenCookies(res);

      sendSuccess(res, 200, 'Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      sendError(res, 500, 'An error occurred during logout');
    }
  },

  /**
   * Refresh access token using refresh token
   * POST /api/auth/refresh
   */
  refreshToken: async (req, res) => {
    try {
      // Get refresh token from cookies or body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return sendError(res, 401, 'Refresh token is required');
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Find user to ensure they still exist
      const user = await User.findById(decoded.id);
      if (!user) {
        return sendError(res, 401, 'User not found');
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      // Set new tokens in cookies
      setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

      sendSuccess(res, 200, 'Token refreshed successfully', {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      clearTokenCookies(res); // Clear invalid tokens
      sendError(res, 401, 'Invalid or expired refresh token');
    }
  },

  /**
   * Get current user info
   * GET /api/auth/me
   */
  getCurrentUser: async (req, res) => {
    try {
      // User is already attached by isAuthenticated middleware
      if (!req.user) {
        return sendError(res, 401, 'Not authenticated');
      }

      // Fetch fresh user data from database
      const user = await User.findById(req.user.id).select('-password');

      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      sendSuccess(res, 200, 'User data retrieved successfully', {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          nom: user.nom,
          prenom: user.prenom,
          etablissement: user.etablissement,
          filiere: user.filiere,
          dateNaissance: user.dateNaissance,
          sexe: user.sexe
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      sendError(res, 500, 'Failed to retrieve user data');
    }
  },

  /**
   * Verify token validity
   * GET /api/auth/verify
   */
  verifyToken: (req, res) => {
    // If this endpoint is reached, the middleware already verified the token
    sendSuccess(res, 200, 'Token is valid', {
      user: req.user
    });
  }
};

module.exports = authControllerJWT;
