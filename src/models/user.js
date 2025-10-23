// In-memory storage for demonstration
// Replace with actual database implementation (MongoDB, PostgreSQL, etc.)
const users = new Map();
let nextId = 1;

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  static async create(userData) {
    const user = {
      id: nextId++,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.set(user.id, user);
    return user;
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    return users.get(id) || null;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    return Array.from(users.values()).find((user) => user.email === email) || null;
  }

  /**
   * Update user by ID
   * @param {number} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated user or null
   */
  static async updateById(id, updates) {
    const user = users.get(id);
    if (!user) {
      return null;
    }

    const updatedUser = {
      ...user,
      ...updates,
      id: user.id, // Prevent ID change
      createdAt: user.createdAt, // Prevent createdAt change
      updatedAt: new Date().toISOString(),
    };

    users.set(id, updatedUser);
    return updatedUser;
  }

  /**
   * Delete user by ID
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async deleteById(id) {
    return users.delete(id);
  }

  /**
   * Get all users
   * @returns {Promise<Array>} Array of users
   */
  static async findAll() {
    return Array.from(users.values());
  }
}

module.exports = User;
