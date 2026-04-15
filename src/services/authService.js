const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { ERROR_MESSAGES } = require('../config/constants');
const User = require('../models/user');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user object (without password)
   */
  async register(userData) {
    const { email, password, name } = userData;

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error(ERROR_MESSAGES.USER_ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
    });

    // Return user without password
    return this.sanitizeUser(user);
  }

  /**
   * Authenticate user and generate token
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User object and JWT token
   */
  async login(email, password) {
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Generate token
    const token = this.generateToken({ id: user.id, email: user.email });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    return bcrypt.hash(password, config.bcrypt.saltRounds);
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   * @param {Object} payload - Token payload
   * @returns {string} JWT token
   */
  generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error(ERROR_MESSAGES.TOKEN_EXPIRED);
      }
      throw new Error(ERROR_MESSAGES.TOKEN_INVALID);
    }
  }

  /**
   * Remove sensitive data from user object
   * @param {Object} user - User object
   * @returns {Object} Sanitized user object
   */
  sanitizeUser(user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = new AuthService();
