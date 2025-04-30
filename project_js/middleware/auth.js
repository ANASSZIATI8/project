/**
 * Authentication and Authorization Middleware
 */

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
      return next();
    }
    req.flash('error', 'Please log in to access this page');
    res.redirect('/login');
  };
  
  // Check if user is a guest (not logged in)
  const isGuest = (req, res, next) => {
    if (!req.session.user) {
      return next();
    }
    
    // Redirect to appropriate dashboard based on role
    const redirectPath = req.session.user.role === 'student'
      ? '/student/dashboard'
      : '/teacher/dashboard';
    
    res.redirect(redirectPath);
  };
  
  module.exports = {
    isAuthenticated,
    isGuest
  };