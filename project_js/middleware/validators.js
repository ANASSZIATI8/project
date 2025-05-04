const { body } = require('express-validator');

// Validation rules for login
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address'),
    
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Validation rules for registration
const validateRegistration = [
  body('nom')
    .trim()
    .notEmpty().withMessage('Nom is required')
    .isLength({ min: 2 }).withMessage('Nom must be at least 2 characters'),
  
  body('prenom')
    .trim()
    .notEmpty().withMessage('Prénom is required')
    .isLength({ min: 2 }).withMessage('Prénom must be at least 2 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address'),
  
  body('dateNaissance')
    .notEmpty().withMessage('Date de naissance is required')
    .isISO8601().toDate().withMessage('Please enter a valid date'),
  
  body('sexe')
    .notEmpty().withMessage('Sexe is required')
    .isIn(['M', 'F']).withMessage('Sexe must be M or F'),
  
  body('etablissement')
    .trim()
    .notEmpty().withMessage('Établissement is required'),
  
  body('filiere')
    .trim()
    .notEmpty().withMessage('Filière is required'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  body('typeUtilisateur')
    .isIn(['etudiant', 'enseignant']).withMessage('Invalid role selected'),
  
  body('terms')
    .custom(value => {
      // Accept "true", true, "on", or any truthy value
      if (value === true || value === 'true' || value === 'on' || value === 1 || value === '1') {
        return true;
      }
      throw new Error('You must agree to the terms and conditions');
    })
];

module.exports = {
  validateLogin,
  validateRegistration
};