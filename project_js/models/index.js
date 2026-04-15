// models/index.js
const mongoose = require('mongoose');

// Import models
const Exam = require('./exam');
const Question = require('./question');

// Export models
module.exports = {
  Exam,
  Question
};