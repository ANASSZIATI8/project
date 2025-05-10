/**
 * Main application file
 * Online Examination System
 */

// Core dependencies - only using what's absolutely needed
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

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
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 jour en secondes
  }),
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
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  
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
const studentRoutes = require('./routes/student');
const teacherStudentsRoutes = require('./routes/exam');
app.use('/', teacherStudentsRoutes);
// Use the auth routes - AFTER middleware is set up
app.use('/', authRoutes);

// Use exam, question and submission routes
app.use('/', examRoutes);
app.use('/api', questionRoutes);
app.use('/api', submissionRoutes);
app.use('/', studentRoutes);

// Home page route
app.get('/', (req, res) => {
  // Si utilisateur connecté, rediriger vers le tableau de bord approprié
  if (req.session.user) {
    if (req.session.user.role === 'student') {
      return res.redirect('/student-dashboard');
    } else if (req.session.user.role === 'teacher') {
      return res.redirect('/teacher-dashboard');
    }
  }
  
  res.render('index', {
    title: 'Online Examination System',
    welcomeMessage: 'Welcome to the Online Examination Platform',
    description: 'Take exams, create tests, and track progress easily'
  });
});

// ==============================================
// Teacher Routes
// ==============================================

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
      time: duration, // Utiliser "time" au lieu de "duration" pour la compatibilité
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
    question.time = parseInt(req.body.duration) || 60; // Utiliser "time" au lieu de "duration"
    
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
      studentCount: studentCount,
      stats: {
        examsCount: examCount,
        submissionsCount: 0,
        averageScore: 0
      }
    });
  } catch (err) {
    console.error('Erreur lors du chargement du tableau de bord:', err);
    req.flash('error', 'Erreur lors du chargement du tableau de bord');
    res.render('teacher-dashboard', {
      user: req.session.user,
      exams: [],
      examCount: 0,
      studentCount: 0,
      stats: {
        examsCount: 0,
        submissionsCount: 0,
        averageScore: 0
      }
    });
  }
});
app.use(express.static(path.join(__dirname, 'public')));
// ==============================================
// Nouvelles routes pour les questions séquentielles
// ==============================================

// Route pour passer à la question suivante
app.post('/student-next-question/:submissionId', async (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.status(401).json({ success: false, error: 'Non autorisé' });
  }
  
  try {
    // Récupérer la soumission
    const submission = await StudentExamSubmission.findById(req.params.submissionId);
    
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Soumission non trouvée' });
    }
    
    // Vérifier que l'étudiant est bien l'auteur de cette soumission
    if (submission.student.toString() !== req.session.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    // Récupérer l'examen avec les questions
    const exam = await Exam.findById(submission.exam).populate('questions');
    
    // Si currentQuestionIndex n'est pas défini, l'initialiser à 0
    if (submission.currentQuestionIndex === undefined) {
      submission.currentQuestionIndex = 0;
    }
    
    // Vérifier s'il reste des questions
    if (submission.currentQuestionIndex < exam.questions.length - 1) {
      // Passer à la question suivante
      submission.currentQuestionIndex += 1;
      await submission.save();
      
      return res.json({ success: true, nextIndex: submission.currentQuestionIndex });
    } else {
      // C'était la dernière question
      return res.json({ success: true, isLast: true });
    }
  } catch (err) {
    console.error('Erreur lors du passage à la question suivante:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors du passage à la question suivante' });
  }
});

// Route pour afficher l'interface de l'examen
app.get('/student-take-exam/:submissionId', async (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'student') {
    req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
    return res.redirect('/login');
  }
  
  try {
    const { submissionId } = req.params;
    
    // Récupérer la soumission d'examen
    const submission = await StudentExamSubmission.findById(submissionId);
    
    if (!submission) {
      req.flash('error', 'Examen non trouvé');
      return res.redirect('/student-dashboard');
    }
    
    // Vérifier que l'étudiant est bien l'auteur de cette soumission
    if (submission.student.toString() !== req.session.user.id.toString()) {
      req.flash('error', 'Vous n\'êtes pas autorisé à accéder à cet examen');
      return res.redirect('/student-dashboard');
    }
    
    // Vérifier que l'examen n'est pas terminé
    if (submission.completed) {
      req.flash('info', 'Vous avez déjà terminé cet examen');
      return res.redirect(`/student-exam-results/${submissionId}`);
    }
    
    // Récupérer l'examen avec les questions
    const exam = await Exam.findById(submission.exam).populate('questions');
    
    if (!exam) {
      req.flash('error', 'Examen non trouvé');
      return res.redirect('/student-dashboard');
    }
    
    // Calculer le temps restant pour l'examen
    const startTime = new Date(submission.startTime);
    const now = new Date();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    const totalSeconds = exam.duration * 60;
    const remainingSeconds = totalSeconds - elapsedSeconds;
    
    // Si le temps est écoulé, terminer automatiquement l'examen
    if (remainingSeconds <= 0) {
      submission.status = 'timed-out';
      submission.endTime = new Date();
      submission.completed = true;
      await submission.save();
      
      return res.redirect(`/student-exam-results/${submissionId}`);
    }
    
    // Si aucun index de question actuelle n'est défini, initialiser à 0
    if (submission.currentQuestionIndex === undefined) {
      submission.currentQuestionIndex = 0;
      await submission.save();
    }
    
    // Obtenir la question actuelle
    const currentQuestion = exam.questions[submission.currentQuestionIndex];
    
    // Formater les données d'examen et de question pour le template
    const examData = {
      id: exam._id,
      title: exam.title,
      subject: exam.subject,
      duration: exam.duration,
      totalQuestions: exam.questions.length,
      remainingTime: remainingSeconds
    };
    
    const questionData = currentQuestion ? {
      id: currentQuestion._id,
      text: currentQuestion.text,
      type: currentQuestion.type,
      options: currentQuestion.options,
      points: currentQuestion.points,
      time: currentQuestion.time || 60, // Temps par défaut: 60 secondes
      mediaType: currentQuestion.media?.type || 'none',
      mediaUrl: currentQuestion.media?.url || '',
      index: submission.currentQuestionIndex,
      number: submission.currentQuestionIndex + 1
    } : null;
    
    // Obtenir la réponse actuelle si elle existe
    const currentAnswer = submission.answers.find(
      a => a.question && a.question.toString() === currentQuestion?._id.toString()
    );
    
    res.render('student-take-exam', {
      user: req.session.user,
      exam: examData,
      question: questionData,
      submission: submission,
      currentAnswer: currentAnswer,
      isLastQuestion: submission.currentQuestionIndex === exam.questions.length - 1
    });
  } catch (err) {
    console.error('Erreur lors du chargement de l\'examen:', err);
    req.flash('error', 'Erreur lors du chargement de l\'examen: ' + err.message);
    res.redirect('/student-dashboard');
  }
});

// Route pour enregistrer la réponse à une question
app.post('/student-save-answer/:submissionId/:questionId', async (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.status(401).json({ success: false, error: 'Non autorisé' });
  }
  
  try {
    const submissionId = req.params.submissionId;
    const questionId = req.params.questionId;
    const { selectedOptions, textAnswer, timeTaken } = req.body;
    
    // Récupérer la soumission d'examen
    const submission = await StudentExamSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Soumission non trouvée' });
    }
    
    // Vérifier que l'étudiant est bien l'auteur de cette soumission
    if (submission.student.toString() !== req.session.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    // Récupérer la question
    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question non trouvée' });
    }
    
    // Déterminer si la réponse est correcte
    let isCorrect = false;
    let points = 0;
    
    if (question.type === 'mcq') {
      // Pour les QCM, vérifier si les options sélectionnées correspondent aux options correctes
      const correctOptionIndices = question.options
        .map((option, index) => option.isCorrect ? index.toString() : null)
        .filter(index => index !== null);
      
      // Comparer les options sélectionnées avec les options correctes
      const selectedIndices = Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions];
      isCorrect = correctOptionIndices.length === selectedIndices.length &&
                 correctOptionIndices.every(index => selectedIndices.includes(index));
    } else {
      // Pour les questions directes, comparer la réponse avec la réponse correcte
      if (textAnswer && question.correctAnswer) {
        // Calculer la similarité entre les deux chaînes
        const similarity = calculateStringSimilarity(
          textAnswer.toLowerCase(),
          question.correctAnswer.toLowerCase()
        );
        
        // Si la similarité est supérieure au seuil de tolérance, la réponse est correcte
        isCorrect = similarity >= (100 - (question.tolerance || 10)) / 100;
      }
    }
    
    // Attribuer les points si la réponse est correcte
    if (isCorrect) {
      points = question.points;
    }
    
    // Rechercher si une réponse existe déjà pour cette question
    const existingAnswerIndex = submission.answers.findIndex(
      answer => answer.question && answer.question.toString() === questionId
    );
    
    const answerData = {
      question: questionId,
      selectedOptions: Array.isArray(selectedOptions) ? selectedOptions : selectedOptions ? [selectedOptions] : [],
      textAnswer: textAnswer || '',
      isCorrect,
      points,
      timeTaken: parseInt(timeTaken) || 0,
      submittedAt: new Date()
    };
    
    if (existingAnswerIndex !== -1) {
      // Mettre à jour la réponse existante
      submission.answers[existingAnswerIndex] = answerData;
    } else {
      // Ajouter une nouvelle réponse
      submission.answers.push(answerData);
    }
    
    await submission.save();
    
    res.json({ success: true, isCorrect, points });
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement de la réponse:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'enregistrement de la réponse' });
  }
});

// Route pour terminer l'examen
app.post('/student-finish-exam/:submissionId', async (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'student') {
    req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
    return res.redirect('/login');
  }
  
  try {
    const submissionId = req.params.submissionId;
    
    // Récupérer la soumission d'examen
    const submission = await StudentExamSubmission.findById(submissionId)
      .populate('exam');
    
    if (!submission) {
      req.flash('error', 'Soumission non trouvée');
      return res.redirect('/student-dashboard');
    }
    
    // Vérifier que l'étudiant est bien l'auteur de cette soumission
    if (submission.student.toString() !== req.session.user.id.toString()) {
      req.flash('error', 'Vous n\'êtes pas autorisé à accéder à cette soumission');
      return res.redirect('/student-dashboard');
    }
    
    // Calculer le score total
    const totalPoints = submission.answers.reduce((sum, answer) => sum + answer.points, 0);
    
    // Récupérer le total des points possibles pour l'examen
    const exam = await Exam.findById(submission.exam._id).populate('questions');
    
    const possiblePoints = exam.questions.reduce((sum, question) => sum + question.points, 0);
    
    // Calculer le pourcentage
    const percentageScore = possiblePoints > 0 ? (totalPoints / possiblePoints) * 100 : 0;
    
    // Mettre à jour la soumission
    submission.endTime = new Date();
    submission.totalScore = totalPoints;
    submission.percentageScore = percentageScore;
    submission.status = 'completed';
    submission.completed = true;
    
    await submission.save();
    
    // Rediriger vers la page des résultats
    res.redirect(`/student-exam-results/${submissionId}`);
  } catch (err) {
    console.error('Erreur lors de la finalisation de l\'examen:', err);
    req.flash('error', 'Erreur lors de la finalisation de l\'examen');
    res.redirect('/student-dashboard');
  }
});

// Route pour enregistrer la géolocalisation
app.post('/student-save-geolocation/:submissionId', async (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.status(401).json({ success: false, error: 'Non autorisé' });
  }
  
  try {
    const submissionId = req.params.submissionId;
    const { latitude, longitude, accuracy } = req.body;
    
    // Mettre à jour la soumission avec les données de géolocalisation
    await StudentExamSubmission.findByIdAndUpdate(submissionId, {
      'geolocation.latitude': latitude,
      'geolocation.longitude': longitude,
      'geolocation.accuracy': accuracy,
      'geolocation.timestamp': new Date()
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement de la géolocalisation:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'enregistrement de la géolocalisation' });
  }
});

// Route pour afficher les résultats de l'examen
app.get('/student-exam-results/:submissionId', async (req, res) => {
  // Vérifier l'authentification
  if (!req.session.user || req.session.user.role !== 'student') {
    req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
    return res.redirect('/login');
  }
  
  try {
    const submissionId = req.params.submissionId;
    
    // Récupérer la soumission d'examen avec toutes les données associées
    const submission = await StudentExamSubmission.findById(submissionId)
      .populate('exam')
      .populate('student')
      .populate('answers.question');
    
    if (!submission) {
      req.flash('error', 'Résultats non trouvés');
      return res.redirect('/student-dashboard');
    }
    
    // Vérifier que l'étudiant est bien l'auteur de cette soumission
    if (submission.student._id.toString() !== req.session.user.id.toString()) {
      req.flash('error', 'Vous n\'êtes pas autorisé à accéder à ces résultats');
      return res.redirect('/student-dashboard');
    }
    
    res.render('student-exam-results', {
      user: req.session.user,
      submission
    });
  } catch (err) {
    console.error('Erreur lors du chargement des résultats:', err);
    req.flash('error', 'Erreur lors du chargement des résultats');
    res.redirect('/student-dashboard');
  }
});

// Fonction utilitaire pour calculer la similarité entre deux chaînes
function calculateStringSimilarity(str1, str2) {
  if (str1 === str2) return 100;
  
  const max = Math.max(str1.length, str2.length);
  if (max === 0) return 100;
  
  // Algorithme simple de distance de Levenshtein
  const matrix = [];
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // suppression
        );
      }
    }
  }
  
  const distance = matrix[str1.length][str2.length];
  return (1 - distance / max) * 100;
}

// ==============================================
// Debug endpoints
// ==============================================
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

// Ajoutez ce code dans app.js ou créez une route de débogage temporaire
app.get('/debug-exam/:examId', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId).populate('questions');
    res.json({
      title: exam.title,
      questionCount: exam.questions.length,
      questions: exam.questions.map(q => ({
        id: q._id,
        text: q.text
      }))
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Export the app (to be used by server.js)
module.exports = app;