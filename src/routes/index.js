const express = require('express');
const authRoutes = require('./authRoutes');

const router = express.Router();

// API version prefix
router.use('/v1/auth', authRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      health: '/health',
    },
  });
});

module.exports = router;
