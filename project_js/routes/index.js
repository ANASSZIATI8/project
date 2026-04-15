// routes/index.js
const express = require('express');
const router = express.Router();
const examRoutes = require('./examRoutes');
const questionRoutes = require('./questionRoutes');
const submissionRoutes = require('./submissionRoutes');

// Use routes
router.use('/api', examRoutes);
router.use('/api', questionRoutes);
router.use('/api', submissionRoutes);

// Handle teacher dashboard form submissions
router.post('/teacher/exams/create', (req, res, next) => {
  // Add the createdBy field
  req.body.createdBy = req.session.user.id;
  
  // Redirect to API route
  req.url = '/api/exams/create';
  next();
}, examRoutes);

module.exports = router;