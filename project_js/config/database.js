  const mongoose = require('mongoose');
  require('dotenv').config();

  // MongoDB connection string
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/anass';

  // Enhanced function to connect to MongoDB
  const connectDB = async () => {
    try {
      // Log connection attempt
      console.log('Attempting to connect to MongoDB...');
      console.log('Using database:', mongoURI.split('/').pop().split('?')[0]); // Extract DB name without exposing full URI

      // If already connected, return the existing connection
      if (mongoose.connection.readyState === 1) {
        console.log('Already connected to MongoDB');
        return mongoose.connection;
      }

      // Attempt connection with enhanced options for better stability
      const conn = await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 10000, // Increased from 5000
        socketTimeoutMS: 45000,
        maxPoolSize: 10, // Add connection pooling
        minPoolSize: 2,
        connectTimeoutMS: 10000,
        retryWrites: true,
        retryReads: true
      });
      
      // Extended connection test
      console.log(`MongoDB connected successfully to database: ${mongoose.connection.db.databaseName}`);
      
      // Verify connection by listing collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name).join(', '));
      
      // Test if we can run a simple query (this confirms read permission)
      const stats = await mongoose.connection.db.stats();
      console.log(`Database contains ${stats.collections} collections and ${stats.objects} total documents`);
      
      return conn;
    } catch (error) {
      // Enhanced error logging
      console.error('MongoDB connection error:');
      console.error('  Message:', error.message);
      console.error('  Error code:', error.code);
      console.error('  Name:', error.name);
      
      // Check for common connection issues
      if (error.name === 'MongoServerSelectionError') {
        console.error('  Connection refused. Check that MongoDB server is running.');
        console.error('  Check that the URI is correct and the server is accessible.');
      } else if (error.name === 'MongoError' && error.code === 18) {
        console.error('  Authentication failed. Check username and password in the URI.');
      } else if (error.name === 'MongoError' && error.code === 13) {
        console.error('  Authorization failed. Check user permissions for this database.');
      }
      
      // Don't immediately exit in case of error - instead retry
      if (process.env.NODE_ENV === 'production') {
        console.log('Will retry connection in 5 seconds...');
        setTimeout(() => connectDB(), 5000);
      } else {
        // In development, exit if explicitly requested
        if (process.env.EXIT_ON_DB_FAIL === 'true') {
          process.exit(1);
        } else {
          throw error; // Re-throw for handling by caller
        }
      }
    }
  };

  // Connection event listeners
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established');
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    
    // Auto-reconnect if not shutting down
    if (process.env.NODE_ENV === 'production') {
      console.log('Attempting to reconnect...');
      setTimeout(() => connectDB(), 5000);
    }
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  // Add validation that models are registered properly
  const validateModels = () => {
    const modelNames = mongoose.modelNames();
    console.log('Registered Mongoose models:', modelNames.join(', '));
    
    // Verify Exam model exists since that's what you're having trouble with
    if (modelNames.includes('Exam')) {
      console.log('✅ Exam model is properly registered');
    } else {
      console.error('❌ Exam model is NOT registered! Check model definition');
    }
  };

  // Export both the connection function and validation
  module.exports = connectDB;
  module.exports.validateModels = validateModels;