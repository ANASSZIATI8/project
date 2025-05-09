const User = require('../models/user');
const { validationResult } = require('express-validator');

/**
 * Auth Controller - Handles authentication logic
 */
const authController = {
  /**
   * Render login page
   */
  getLoginPage: (req, res) => {
    // Create safe defaults if flash messages aren't available
    let errorMessage = '';
    let successMessage = '';
    let formData = {};
    
    // Check if req.flash is defined before using it
    if (typeof req.flash === 'function') {
      errorMessage = req.flash('error');
      successMessage = req.flash('success');
      formData = req.flash('formData')[0] || {};
    }
    
    res.render('login', { 
      title: 'Login - Online Examination System',
      errorMessage,
      successMessage,
      formData
    });
  },

  /**
   * Render registration page
   */
  getRegisterPage: (req, res) => {
    // Create safe defaults if flash messages aren't available
    let errorMessage = '';
    let formData = {};
    
    // Check if req.flash is defined before using it
    if (typeof req.flash === 'function') {
      errorMessage = req.flash('error');
      formData = req.flash('formData')[0] || {};
    } else if (req.session) {
      errorMessage = req.session.registerError || '';
      formData = req.session.formData || {};
      // Clear session errors after reading them
      delete req.session.registerError;
      delete req.session.formData;  // Correction ici
    }
    
    console.log('Rendering register page with errors:', errorMessage);
    
    res.render('register', { 
      title: 'Register - Online Examination System',
      errorMessage,
      formData,
      errors: [] // Adding an empty errors array for template safety
    });
  },

  /**
   * Process login form submission
   */
  login: async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Find user by email
      const user = await User.findOne({ email });
      
      // DEBUG: Log user found
      console.log('User found:', user ? 'Yes' : 'No');
      
      // Check if user exists and password matches
      if (!user || !(await user.comparePassword(password))) {
        console.log('Login failed: Invalid credentials');
        
        // If flash is available, use it
        if (typeof req.flash === 'function') {
          req.flash('error', 'Invalid email or password');
          req.flash('formData', { email });
        }
        // Otherwise, store error in session
        else if (req.session) {
          req.session.loginError = 'Invalid email or password';
          req.session.formData = { email };
        }
        
        return res.redirect('/login');
      }
      
      // Login successful
      console.log('Login successful for:', email);
      
      // Set success message
      if (typeof req.flash === 'function') {
        req.flash('success', 'Login successful! Welcome back.');
      } else if (req.session) {
        req.session.loginSuccess = 'Login successful! Welcome back.';
      }
      
      // Set session user
      req.session.user = {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: `${user.prenom} ${user.nom}` // Add full name for display
      };
      
      // Redirect after login based on role
      const redirectPath = user.role === 'student' ? '/student-dashboard' : '/teacher-dashboard';
      res.redirect(redirectPath);
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle error with or without flash
      if (typeof req.flash === 'function') {
        req.flash('error', 'An error occurred during login: ' + error.message);
        req.flash('formData', { email });
      } else if (req.session) {
        req.session.loginError = 'An error occurred during login: ' + error.message;
        req.session.formData = { email };
      }
      
      return res.redirect('/login');
    }
  },
  
  /**
   * Process registration form submission
   */
  register: async (req, res) => {
    try {
      // Check if req.body exists
      console.log('Request body:', req.body);
      if (!req.body) {
        console.error('req.body is undefined');
        
        // Handle error with or without flash
        if (typeof req.flash === 'function') {
          req.flash('error', 'No form data received');
        } else if (req.session) {
          req.session.registerError = 'No form data received';
        }
        
        return res.redirect('/register');
      }
      
      // Extract form data using correct field names
      const { 
        nom, 
        prenom, 
        dateNaissance, 
        sexe, 
        etablissement, 
        filiere, 
        email, 
        password, 
        confirmPassword, 
        typeUtilisateur // This is the field name in the form, not "role"
      } = req.body;
      
      // Map typeUtilisateur values to database role values
      const role = typeUtilisateur === 'enseignant' ? 'teacher' : 'student';
      
      const terms = req.body.terms === 'on' || req.body.terms === true;
      
      // Form data to potentially pass back - use typeUtilisateur instead of role
      const formDataObj = { 
        nom, 
        prenom, 
        dateNaissance, 
        sexe, 
        etablissement, 
        filiere, 
        email, 
        typeUtilisateur
      };
      
      // Validation errors check (from express-validator middleware)
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Store error using flash or session
        const errorMsg = errors.array()[0].msg;
        if (typeof req.flash === 'function') {
          req.flash('error', errorMsg);
          req.flash('formData', formDataObj);
        } else if (req.session) {
          req.session.registerError = errorMsg;
          req.session.formData = formDataObj;
        }
        return res.redirect('/register');
      }
  
      // Custom validation
      if (password !== confirmPassword) {
        // Store error using flash or session
        if (typeof req.flash === 'function') {
          req.flash('error', 'Passwords do not match');
          req.flash('formData', formDataObj);
        } else if (req.session) {
          req.session.registerError = 'Passwords do not match';
          req.session.formData = formDataObj;
        }
        return res.redirect('/register');
      }
  
      if (!terms) {
        // Store error using flash or session
        if (typeof req.flash === 'function') {
          req.flash('error', 'You must agree to the Terms of Service');
          req.flash('formData', formDataObj);
        } else if (req.session) {
          req.session.registerError = 'You must agree to the Terms of Service';
          req.session.formData = formDataObj;
        }
        return res.redirect('/register');
      }
  
      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        // Store error using flash or session
        if (typeof req.flash === 'function') {
          req.flash('error', 'Email is already registered');
          req.flash('formData', formDataObj);
        } else if (req.session) {
          req.session.registerError = 'Email is already registered';
          req.session.formData = formDataObj;
        }
        return res.redirect('/register');
      }
  
      // Create new user - using the mapped role value
      const user = await new User({
        nom,
        prenom,
        dateNaissance,
        sexe,
        etablissement,        // Inclure directement etablissement
        institution: etablissement,  // Conserver aussi ce mappage par sécurité
        filiere,
        email,
        password,
        role // Use the mapped value instead of typeUtilisateur
      }).save();
      
      // Success message
      if (typeof req.flash === 'function') {
        req.flash('success', 'Registration successful! Please login.');
      } else if (req.session) {
        req.session.loginSuccess = 'Registration successful! Please login.';
      }
      
      return res.redirect('/login');
  
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle error with or without flash
      if (typeof req.flash === 'function') {
        req.flash('error', 'An error occurred during registration: ' + error.message);
      } else if (req.session) {
        req.session.registerError = 'An error occurred during registration: ' + error.message;
      }
      
      return res.redirect('/register');
    }
  }

  /**
   * Process user logout
   */
  ,logout: (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect('/login');
    });
  }
};

module.exports = authController;