// middleware/auth.js

// Middleware to check if user is a guest (not logged in)
const isGuest = (req, res, next) => {
  // Check if session exists and has user property before accessing
  if (req.session && req.session.user) {
    // User is logged in, redirect to appropriate dashboard
    if (req.session.user.role === 'student') {
      return res.redirect('/student-dashboard');
    } else if (req.session.user.role === 'teacher') {
      return res.redirect('/teacher-dashboard');
    }
    // If role is not specified, redirect to a general dashboard
    return res.redirect('/dashboard');
  }
  // User is not logged in, proceed to login/register page
  next();
};

// Middleware to check if user is authenticated (logged in)
const isAuthenticated = (req, res, next) => {
  // Check if session exists and has user property
  if (!req.session || !req.session.user) {
    // User is not logged in, redirect to login page
    return res.redirect('/login');
  }
  // User is logged in, proceed to protected route
  next();
};

// Middleware to check if user is a student
const isStudent = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  
  if (req.session.user.role !== 'student') {
    return res.status(403).render('error', {
      title: 'Access Denied',
      message: 'You do not have permission to access this page.'
    });
  }
  
  next();
};

// Middleware to check if user is a teacher
const isTeacher = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  
  if (req.session.user.role !== 'teacher') {
    return res.status(403).render('error', {
      title: 'Access Denied',
      message: 'You do not have permission to access this page.'
    });
  }
  
  next();
};

module.exports = {
  isGuest,
  isAuthenticated,
  isStudent,
  isTeacher
};