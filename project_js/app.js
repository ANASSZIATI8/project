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

// Import models
const Exam = require('./models/exam');
const Question = require('./models/question');
const StudentExamSubmission = require('./models/StudentExamSubmission');
const User = require('./models/user');

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
const examRoutes = require('./routes/exam');
const questionRoutes = require('./routes/question');
const submissionRoutes = require('./routes/submission');

// Use the auth routes - AFTER middleware is set up
app.use('/', authRoutes);

// Use exam, question and submission routes
app.use('/', examRoutes); // Changed from '/api' to '/' to fix the path
app.use('/api', questionRoutes);
app.use('/api', submissionRoutes);

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

// Route pour afficher la page de gestion des questions d'un examen
app.get('/teacher-exams/:id/questions', async (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'teacher') {
    req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
    return res.redirect('/login');
  }
  
  try {
    // Récupérer l'examen
    const exam = await Exam.findById(req.params.id).populate('questions');
    
    if (!exam) {
      req.flash('error', 'Examen non trouvé');
      return res.redirect('/teacher-exams');
    }
    
    // Vérifier que l'enseignant est propriétaire de l'examen
    const examCreatorId = exam.createdBy ? exam.createdBy.toString() : null;
    const teacherId = req.session.user.id.toString();
    
    if (examCreatorId !== teacherId) {
      req.flash('error', 'Vous n\'avez pas la permission de modifier cet examen');
      return res.redirect('/teacher-exams');
    }
    
    // Calculer le total des points des questions
    let totalPoints = 0;
    if (exam.questions && exam.questions.length > 0) {
      totalPoints = exam.questions.reduce((total, q) => total + (q.points || 0), 0);
    }
    
    res.render('teacher-exam-questions', {
      user: req.session.user,
      exam,
      totalPoints
    });
  } catch (err) {
    console.error('Erreur lors du chargement des questions:', err);
    req.flash('error', 'Erreur lors du chargement des questions');
    res.redirect('/teacher-exams');
  }
});

// Route pour voir un examen spécifique
app.get('/teacher-exams/:id', async (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'teacher') {
    req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
    return res.redirect('/login');
  }
  
  try {
    const examId = req.params.id;
    const exam = await Exam.findById(examId).populate('questions');
    
    if (!exam) {
      req.flash('error', 'Examen non trouvé');
      return res.redirect('/teacher-exams');
    }
    
    // Calculer le total des points des questions
    let totalPoints = 0;
    if (exam.questions && exam.questions.length > 0) {
      totalPoints = exam.questions.reduce((total, q) => total + (q.points || 0), 0);
    }
    
    res.render('teacher-view-exam', {
      user: req.session.user,
      exam,
      totalPoints
    });
  } catch (err) {
    console.error('Erreur lors du chargement de l\'examen:', err);
    req.flash('error', 'Erreur lors du chargement de l\'examen');
    res.redirect('/teacher-exams');
  }
});

// Route pour ajouter une question à un examen
app.post('/teacher-exams/:id/questions', async (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'teacher') {
    req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
    return res.redirect('/login');
  }
  
  try {
    // Récupérer l'examen
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      req.flash('error', 'Examen non trouvé');
      return res.redirect('/teacher-exams');
    }
    
    // Vérifier que l'enseignant est propriétaire de l'examen
    const examCreatorId = exam.createdBy ? exam.createdBy.toString() : null;
    const teacherId = req.session.user.id.toString();
    
    if (examCreatorId !== teacherId) {
      req.flash('error', 'Vous n\'avez pas la permission de modifier cet examen');
      return res.redirect('/teacher-exams');
    }
    
    // Créer la nouvelle question
    const questionType = req.body.questionType;
    const questionText = req.body.questionText;
    const points = parseInt(req.body.points) || 1;
    const duration = parseInt(req.body.duration) || 60;
    
    let questionData = {
      text: questionText,
      type: questionType,
      points: points,
      duration: duration,
      createdBy: req.session.user.id
    };
    
    // Ajouter les données spécifiques selon le type de question
    if (questionType === 'mcq') {
      const options = req.body.options || [];
      const correctOptions = req.body.correctOptions || [];
      
      // Formater les options
      questionData.options = options.map((text, index) => ({
        text: text,
        isCorrect: correctOptions.includes(index.toString())
      }));
    } else {
      // Question directe
      questionData.correctAnswer = req.body.correctAnswer;
      questionData.tolerance = parseInt(req.body.tolerance) || 10;
    }
    
    // Ajouter les médias si présents
    if (req.body.mediaUrl && req.body.mediaType) {
      questionData.media = {
        url: req.body.mediaUrl,
        type: req.body.mediaType
      };
    }
    
    // Créer la question dans la base de données
    const question = new Question(questionData);
    await question.save();
    
    // Ajouter la question à l'examen
    exam.questions.push(question._id);
    await exam.save();
    
    req.flash('success', 'Question ajoutée avec succès');
    res.redirect(`/teacher-exams/${exam._id}/questions`);
  } catch (err) {
    console.error('Erreur lors de l\'ajout de la question:', err);
    req.flash('error', `Erreur lors de l'ajout de la question: ${err.message}`);
    res.redirect(`/teacher-exams/${req.params.id}/questions`);
  }
});

// Route pour modifier une question
app.get('/teacher-exams/:examId/questions/:questionId/edit', async (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'teacher') {
    req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
    return res.redirect('/login');
  }
  
  try {
    // Récupérer l'examen et la question
    const exam = await Exam.findById(req.params.examId);
    const question = await Question.findById(req.params.questionId);
    
    if (!exam || !question) {
      req.flash('error', 'Examen ou question non trouvé');
      return res.redirect('/teacher-exams');
    }
    
    // Vérifier les permissions
    const examCreatorId = exam.createdBy ? exam.createdBy.toString() : null;
    const teacherId = req.session.user.id.toString();
    
    if (examCreatorId !== teacherId) {
      req.flash('error', 'Vous n\'avez pas la permission de modifier cet examen');
      return res.redirect('/teacher-exams');
    }
    
    res.render('teacher-edit-question', {
      user: req.session.user,
      exam,
      question
    });
  } catch (err) {
    console.error('Erreur lors du chargement de la question:', err);
    req.flash('error', 'Erreur lors du chargement de la question');
    res.redirect(`/teacher-exams/${req.params.examId}/questions`);
  }
});

// Route pour mettre à jour une question
app.post('/teacher-exams/:examId/questions/:questionId', async (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'teacher') {
    req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
    return res.redirect('/login');
  }
  
  try {
    // Même logique que pour l'ajout mais avec mise à jour
    const exam = await Exam.findById(req.params.examId);
    const question = await Question.findById(req.params.questionId);
    
    if (!exam || !question) {
      req.flash('error', 'Examen ou question non trouvé');
      return res.redirect('/teacher-exams');
    }
    
    // Vérifier les permissions
    const examCreatorId = exam.createdBy ? exam.createdBy.toString() : null;
    const teacherId = req.session.user.id.toString();
    
    if (examCreatorId !== teacherId) {
      req.flash('error', 'Vous n\'avez pas la permission de modifier cet examen');
      return res.redirect('/teacher-exams');
    }
    
    // Mettre à jour les données de la question
    question.text = req.body.questionText;
    question.points = parseInt(req.body.points) || 1;
    question.duration = parseInt(req.body.duration) || 60;
    
    // Mise à jour selon le type de question
    if (question.type === 'mcq') {
      const options = req.body.options || [];
      const correctOptions = req.body.correctOptions || [];
      
      question.options = options.map((text, index) => ({
        text: text,
        isCorrect: correctOptions.includes(index.toString())
      }));
    } else {
      question.correctAnswer = req.body.correctAnswer;
      question.tolerance = parseInt(req.body.tolerance) || 10;
    }
    
    // Mettre à jour les médias
    if (req.body.mediaUrl && req.body.mediaType) {
      question.media = {
        url: req.body.mediaUrl,
        type: req.body.mediaType
      };
    }
    
    await question.save();
    
    req.flash('success', 'Question mise à jour avec succès');
    res.redirect(`/teacher-exams/${exam._id}/questions`);
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la question:', err);
    req.flash('error', `Erreur lors de la mise à jour de la question: ${err.message}`);
    res.redirect(`/teacher-exams/${req.params.examId}/questions`);
  }
});

// Route pour supprimer une question
app.post('/teacher-exams/:examId/questions/:questionId/delete', async (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'teacher') {
    req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
    return res.redirect('/login');
  }
  
  try {
    // Récupérer l'examen et la question
    const exam = await Exam.findById(req.params.examId);
    
    if (!exam) {
      req.flash('error', 'Examen non trouvé');
      return res.redirect('/teacher-exams');
    }
    
    // Vérifier les permissions
    const examCreatorId = exam.createdBy ? exam.createdBy.toString() : null;
    const teacherId = req.session.user.id.toString();
    
    if (examCreatorId !== teacherId) {
      req.flash('error', 'Vous n\'avez pas la permission de modifier cet examen');
      return res.redirect('/teacher-exams');
    }
    
    // Supprimer la question de l'examen
    exam.questions = exam.questions.filter(q => q.toString() !== req.params.questionId);
    await exam.save();
    
    // Supprimer la question de la base de données
    await Question.findByIdAndDelete(req.params.questionId);
    
    req.flash('success', 'Question supprimée avec succès');
    res.redirect(`/teacher-exams/${exam._id}/questions`);
  } catch (err) {
    console.error('Erreur lors de la suppression de la question:', err);
    req.flash('error', `Erreur lors de la suppression de la question: ${err.message}`);
    res.redirect(`/teacher-exams/${req.params.examId}/questions`);
  }
});

// Route Créer un examen
app.get('/teacher-create-exam', (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'teacher') {
    req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
    return res.redirect('/login');
  }
  
  res.render('teacher-create-exam', {
    user: req.session.user
  });
});

// Route Banque de questions
app.get('/teacher-questions', async (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'teacher') {
    req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
    return res.redirect('/login');
  }
  
  try {
    // Récupérer les questions de cet enseignant
    const questions = await Question.find({ createdBy: req.session.user.id })
      .sort({ createdAt: -1 });
    
    // Récupérer les matières pour le filtre
    const examController = require('./controllers/examController');
    const exams = await examController.getExamsByTeacher(req.session.user.id);
    const subjects = [...new Set(exams.map(exam => exam.subject))];
    
    res.render('teacher-questions', {
      user: req.session.user,
      questions,
      subjects
    });
  } catch (err) {
    console.error('Erreur lors du chargement des questions:', err);
    req.flash('error', 'Erreur lors du chargement des questions');
    
    res.render('teacher-questions', {
      user: req.session.user,
      questions: [],
      subjects: []
    });
  }
});

// Route Paramètres
app.get('/teacher-settings', (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'teacher') {
    req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
    return res.redirect('/login');
  }
  
  res.render('teacher-settings', {
    user: req.session.user
  });
});

// Route du tableau de bord enseignant
app.get('/teacher-dashboard', async (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'teacher') {
    req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
    return res.redirect('/login');
  }
  
  try {
    // Récupérer les examens récents de l'enseignant
    const examController = require('./controllers/examController');
    const allExams = await examController.getExamsByTeacher(req.session.user.id);
    
    // Prendre les 5 examens les plus récents
    const recentExams = allExams.slice(0, 5);
    
    // Récupérer quelques statistiques
    const examCount = allExams.length;
    
    // Nombre d'étudiants évalués (à adapter selon votre modèle de données)
    let studentCount = 0;
    
    // Rendre la page avec les données
    res.render('teacher-dashboard', {
      user: req.session.user,
      exams: recentExams,
      examCount: examCount,
      studentCount: studentCount
    });
  } catch (err) {
    console.error('Erreur lors du chargement du tableau de bord:', err);
    req.flash('error', 'Erreur lors du chargement du tableau de bord');
    res.render('teacher-dashboard', {
      user: req.session.user,
      exams: [],
      examCount: 0,
      studentCount: 0
    });
  }
});

// Debug endpoints
app.get('/debug-session', (req, res) => {
  res.json({
    session: req.session,
    user: req.session.user || null
  });
});

app.get('/debug-id-comparison', async (req, res) => {
  if (!req.session.user) {
    return res.json({ error: 'Not logged in' });
  }
  
  try {
    const userId = req.session.user.id;
    
    // Try to convert to ObjectId, with fallback
    let userObjectId;
    try {
      userObjectId = mongoose.Types.ObjectId(userId);
    } catch (err) {
      console.error('Error converting userId to ObjectId:', err);
      userObjectId = userId;
    }
    
    // Get all exams
    const allExams = await Exam.find({});
    
    // Compare IDs in various formats
    const comparisons = allExams.map(exam => {
      const examCreatorId = exam.createdBy;
      let matchAsString = false;
      let matchDirect = false;
      
      if (examCreatorId) {
        matchAsString = examCreatorId.toString() === userId.toString();
        try {
          matchDirect = typeof userObjectId === 'object' ? 
            examCreatorId.equals(userObjectId) : 
            examCreatorId.toString() === userObjectId.toString();
        } catch (err) {
          console.error('Error comparing IDs:', err);
        }
      }
      
      return {
        examId: exam._id.toString(),
        examTitle: exam.title,
        examCreatorId: examCreatorId ? examCreatorId.toString() : null,
        userId: userId.toString(),
        userObjectId: typeof userObjectId === 'object' ? userObjectId.toString() : userObjectId,
        matchAsString,
        matchDirect
      };
    });
    
    res.json({
      userId,
      userObjectId: typeof userObjectId === 'object' ? userObjectId.toString() : userObjectId,
      examCount: allExams.length,
      comparisons
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.get('/debug-exam-schema', async (req, res) => {
  try {
    // Get Exam model schema
    const examSchema = Exam.schema.obj;
    
    // Check a sample exam if any exist
    const sampleExam = await Exam.findOne({});
    
    res.json({
      schema: examSchema,
      createdByType: examSchema.createdBy.type.toString(),
      sampleExam: sampleExam ? {
        _id: sampleExam._id,
        title: sampleExam.title,
        createdBy: sampleExam.createdBy ? {
          value: sampleExam.createdBy.toString(),
          type: typeof sampleExam.createdBy,
          isObjectId: sampleExam.createdBy instanceof mongoose.Types.ObjectId
        } : null
      } : null
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.get('/debug-user', (req, res) => {
  if (!req.session.user) {
    return res.json({ loggedIn: false });
  }
  
  res.json({
    loggedIn: true,
    userId: req.session.user.id,
    userDetails: req.session.user
  });
});

app.get('/debug-user-exams', async (req, res) => {
  // Vérifier si l'utilisateur est connecté
  if (!req.session.user) {
    return res.json({ loggedIn: false, message: "Pas d'utilisateur connecté" });
  }

  try {
    // Récupérer l'ID de l'utilisateur connecté
    const userId = req.session.user.id;
    
    // Récupérer tous les examens
    const allExams = await Exam.find({});
    
    // Filtrer les examens de cet enseignant
    const userExams = allExams.filter(exam => {
      const examCreatorId = exam.createdBy ? exam.createdBy.toString() : null;
      return examCreatorId === userId.toString();
    });
    
    // Préparer la réponse
    res.json({
      userId: userId,
      userRole: req.session.user.role,
      totalExams: allExams.length,
      userExamsCount: userExams.length,
      userExams: userExams.map(e => ({
        id: e._id,
        title: e.title,
        createdBy: e.createdBy.toString()
      })),
      allExamsCreatedBy: allExams.map(e => ({
        id: e._id,
        title: e.title,
        createdBy: e.createdBy ? e.createdBy.toString() : 'None'
      }))
    });
  } catch (err) {
    res.json({ error: err.message });
  }
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