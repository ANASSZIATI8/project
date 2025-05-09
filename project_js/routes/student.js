// routes/student.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { isAuthenticated, isStudent } = require('../middleware/auth');

// Ajouter en haut de votre fichier de routes student.js

// Middleware pour vérifier si l'utilisateur est un étudiant
const checkStudentRole = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'student') {
    req.flash('error', 'Vous devez être connecté en tant qu\'étudiant pour accéder à cette page');
    return res.redirect('/login');
  }
  next();
};

// Routes du tableau de bord étudiant
router.get('/student-dashboard', isAuthenticated, checkStudentRole, studentController.getDashboard);

// Routes d'accès à l'examen
router.get('/student-exam-access', isAuthenticated, checkStudentRole, studentController.getExamAccess);
router.post('/student-exam-access', isAuthenticated, checkStudentRole, studentController.validateExamCode);

// Routes pour passer l'examen
router.get('/student-take-exam/:submissionId', isAuthenticated, checkStudentRole, studentController.takeExam);
router.post('/student-save-geolocation/:submissionId', isAuthenticated, checkStudentRole, studentController.saveGeolocation);
router.post('/student-save-answer/:submissionId/:questionId', isAuthenticated, checkStudentRole, studentController.saveAnswer);
router.post('/student-next-question/:submissionId', isAuthenticated, checkStudentRole, studentController.nextQuestion);
router.post('/student-finish-exam/:submissionId', isAuthenticated, checkStudentRole, studentController.finishExam);

// Routes des résultats
router.get('/student-exam-results/:submissionId', isAuthenticated, checkStudentRole, studentController.examResults);
// Dans routes/student.js

module.exports = router;