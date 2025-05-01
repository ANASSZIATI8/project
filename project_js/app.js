/**
 * Main application file
 * Online Examination System
 */

// Core dependencies - only using what's absolutely needed
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');

// Initialize Express app
const app = express();


// ==============================================
// View Engine Setup
// ==============================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==============================================
// Middleware
// ==============================================
// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session management - simple in-memory store for development
app.use(session({
  secret: 'your_secure_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Flash messages
app.use(flash());

// Global variables middleware
app.use((req, res, next) => {
  // Make user data available to all views
  res.locals.user = req.session.user || null;
  // Flash messages
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  // Current year for footer
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// ==============================================
// Routes - defined directly in app.js for simplicity
// ==============================================

// Home page route
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Online Examination System',
    welcomeMessage: 'Welcome to the Online Examination Platform',
    description: 'Take exams, create tests, and track progress easily'
  });
});

// Login routes
app.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login - Online Examination System',
    errorMessage: req.flash('error'),
    successMessage: req.flash('success'),
    formData: {}
  });
});

app.post('/login', (req, res) => {
  // Mock login functionality
  const { email, password } = req.body;
  
  if (email === 'student@example.com' && password === 'password') {
    req.session.user = {
      id: 1,
      fullName: 'Student User',
      email: email,
      role: 'student'
    };
    return res.redirect('/student-dashboard');
  } else if (email === 'teacher@example.com' && password === 'password') {
    req.session.user = {
      id: 2,
      fullName: 'Teacher User',
      email: email,
      role: 'teacher'
    };
    return res.redirect('/teacher-dashboard');
  } else {
    req.flash('error', 'Invalid email or password');
    return res.redirect('/login');
  }
});

// Register routes
app.get('/register', (req, res) => {
  res.render('register', {
    title: 'Register - Online Examination System',
    errorMessage: req.flash('error'),
    formData: {}
  });
});

app.post('/register', (req, res) => {
  // Mock registration process
  const { fullName, email, password, confirmPassword, role } = req.body;
  
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match');
    return res.redirect('/register');
  }
  
  // Success message
  req.flash('success', 'Registration successful! Please login.');
  return res.redirect('/login');
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
    res.redirect('/login');
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