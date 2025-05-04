// models/index.js
const sequelize = require('../config/database');
const User = require('./user')(sequelize);

// Define associations here if needed
// User.hasMany(SomeOtherModel);

module.exports = {
  sequelize,
  User
};