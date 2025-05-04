const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/anass';

// Function to connect to MongoDB
const connectDB = async () => {
  try {
    // Attempt connection with recommended options for Atlas
    const conn = await mongoose.connect(mongoURI, {
      // These options help with Atlas connections
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    // Simple connection test that doesn't require admin privileges
    console.log(`MongoDB connected successfully to database: ${mongoose.connection.db.databaseName}`);
    return conn;
  } catch (error) {
    // Log detailed error if connection fails
    console.error('MongoDB connection error:', error.message);
    
    // Exit process with failure
    process.exit(1);
  }
};

// Add a listener for disconnection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Add connection error handler
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

module.exports = connectDB;