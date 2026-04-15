const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin, validateRegistration } = require('../middleware/validators');
const { isGuest, isAuthenticated } = require('../middleware/auth');

// Login routes
router.get('/login', isGuest, authController.getLoginPage);
router.post('/login', isGuest, validateLogin, authController.login);

// Register routes
router.get('/register', isGuest, authController.getRegisterPage);

// Add debugging middleware for register route
router.post('/register', (req, res, next) => {
  console.log('Form submission received:');
  console.log('Body:', req.body);
  console.log('Content-Type:', req.headers['content-type']);
  next();
}, isGuest, validateRegistration, authController.register);

// Route du tableau de bord enseignant modifiée
router.get('/teacher-dashboard', isAuthenticated, async (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'teacher') {
    req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
    return res.redirect('/login');
  }
  
  try {
    // Récupérer les examens de l'enseignant
    const examController = require('../controllers/examController');
    const allExams = await examController.getExamsByTeacher(req.session.user.id);
    
    // Prendre les 5 examens les plus récents
    const recentExams = allExams.slice(0, 5);
    
    // Calculer les statistiques
    const examCount = allExams.length;
    const studentCount = 0; // Peut être modifié si vous avez des données de soumission
    
    // Statistiques supplémentaires (compatibilité avec le code existant)
    const stats = {
      examsCount: examCount,
      submissionsCount: 0,
      averageScore: 0
    };
    
    // Rendre la page avec les données complètes
    res.render('teacher-dashboard', {
      user: req.session.user,
      exams: recentExams,
      examCount: examCount, // Variable attendue par le template
      studentCount: studentCount,
      stats: stats, // Pour la compatibilité avec le code existant
      questions: [],
      subjects: [],
      formData: {},
      errors: {},
      success: {}
    });
  } catch (err) {
    console.error('Erreur lors du chargement du tableau de bord:', err);
    
    // En cas d'erreur, afficher quand même la page avec des valeurs par défaut
    res.render('teacher-dashboard', {
      user: req.session.user,
      exams: [],
      examCount: 0,
      studentCount: 0,
      stats: {
        examsCount: 0,
        submissionsCount: 0,
        averageScore: 0
      },
      questions: [],
      subjects: [],
      formData: {},
      errors: {},
      success: {}
    });
  }
});

// Logout route
router.get('/logout', isAuthenticated, authController.logout);

module.exports = router;