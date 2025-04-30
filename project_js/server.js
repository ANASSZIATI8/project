/**
 * Server entry point for Online Examination System
 */

// Import the Express app
const app = require('./app');

// Define port
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});