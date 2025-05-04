/**
 * Server entry point for Online Examination System
 */

// Import the Express app
const app = require('./app');
const connectDB = require('./config/database');

// Define port - get from env which was already loaded in app.js
const PORT = process.env.PORT || 3000;

// Connect to MongoDB first, then start the server
connectDB()
  .then(() => {
    // Start the server only after database connection is established
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });