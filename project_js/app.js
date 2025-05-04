/**
 * Main application file
 * Online Examination System
 */

// Core dependencies - only using what's absolutely needed
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');

// Load environment variables from .env file - only load once
require('dotenv').config();
console.log('Current directory:', __dirname);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI); // For debugging without exposing the actual URI

// Initialize Express app
const app = express();

// ==============================================
// View Engine Setup
// ==============================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==============================================
// Middleware - ORDER IS IMPORTANT
// ==============================================
// Body parsing middleware must come before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET || '8f2a47e1c3b9d5a6f0e8d2c4b7a9f1e0d3b6c9a2e5f8d0b7c4a9e2f5d8b0c7a3',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Flash messages
app.use(flash());

// Global variables middleware
// Global variables middleware
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  
  // Handle flash messages
  res.locals.success_msg = req.flash ? req.flash('success') : [];
  res.locals.error_msg = req.flash ? req.flash('error') : [];
  
  // Handle session-based messages (alternative to flash)
  if (req.session) {
    if (req.session.loginSuccess) {
      res.locals.successMessage = req.session.loginSuccess;
      delete req.session.loginSuccess;
    }
    
    if (req.session.loginError) {
      res.locals.errorMessage = req.session.loginError;
      delete req.session.loginError;
    }
  }
  
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// ==============================================
// Routes - Import from separate files
// ==============================================
// Import the routes
const authRoutes = require('./routes/auth');

// Use the auth routes - AFTER middleware is set up
app.use('/', authRoutes);

// Home page route
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Online Examination System',
    welcomeMessage: 'Welcome to the Online Examination Platform',
    description: 'Take exams, create tests, and track progress easily'
  });
});

// Dashboard routes (placeholder)
app.get('/student-dashboard', (req, res) => {
  // Check if user is logged in and is a student
  if (!req.session.user || req.session.user.role !== 'student') {
    req.flash('error', 'Please log in to access this page');
    return res.redirect('/login');
  }
  
  res.render('index', {
    title: 'Student Dashboard',
    welcomeMessage: 'Student Dashboard',
    description: `Welcome, ${req.session.user.fullName}! This is your student dashboard.`
  });
});

app.get('/teacher-dashboard', (req, res) => {
  // Check if user is logged in and is a teacher
  if (!req.session.user || req.session.user.role !== 'teacher') {
    req.flash('error', 'Please log in to access this page');
    return res.redirect('/login');
  }
  
  res.render('index', {
    title: 'Teacher Dashboard',
    welcomeMessage: 'Teacher Dashboard',
    description: `Welcome, ${req.session.user.fullName}! This is your teacher dashboard.`
  });
});

// ==============================================
// Error Handling
// ==============================================
// 404 - Page Not Found
app.use((req, res) => {
  res.status(404).render('index', { 
    title: '404 - Page Not Found',
    welcomeMessage: 'Page Not Found',
    description: 'The page you are looking for does not exist.'
  });
});

// 500 - Server Error
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).render('index', { 
    title: '500 - Server Error',
    welcomeMessage: 'Server Error',
    description: 'Something went wrong. Please try again later.'
  });
});

// Export the app (to be used by server.js)
module.exports = app;