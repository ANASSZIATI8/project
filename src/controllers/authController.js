const authService = require('../services/authService');
const { HTTP_STATUS, SUCCESS_MESSAGES } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');

class AuthController {
  /**
   * Register a new user
   * @route POST /api/auth/register
   */
  register = asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    const user = await authService.register({ email, password, name });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.USER_CREATED,
      data: { user },
    });
  });

  /**
   * Login user
   * @route POST /api/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { user, token } = await authService.login(email, password);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      data: { user, token },
    });
  });

  /**
   * Get current user profile
   * @route GET /api/auth/me
   */
  getProfile = asyncHandler(async (req, res) => {
    // User is attached by auth middleware
    const user = authService.sanitizeUser(req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { user },
    });
  });
}

module.exports = new AuthController();
