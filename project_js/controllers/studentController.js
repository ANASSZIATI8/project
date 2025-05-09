// controllers/studentController.js
const Exam = require('../models/exam');
const Question = require('../models/question');
const StudentExamSubmission = require('../models/StudentExamSubmission');
const User = require('../models/user');

// Tableau de bord étudiant
exports.getDashboard = async (req, res) => {
  try {
    // Vérifier l'authentification
    if (!req.session.user || req.session.user.role !== 'student') {
      req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
      return res.redirect('/login');
    }
    
    // Récupérer les soumissions d'examen de l'étudiant
    const submissions = await StudentExamSubmission.find({ 
      student: req.session.user.id 
    }).populate('exam').sort({ startTime: -1 });
    
    res.render('student-dashboard', {
      user: req.session.user,
      submissions
    });
  } catch (err) {
    console.error('Erreur lors du chargement du tableau de bord:', err);
    req.flash('error', 'Erreur lors du chargement du tableau de bord');
    res.redirect('/');
  }
};

// Page pour entrer le code d'accès
exports.getExamAccess = async (req, res) => {
  try {
    // Vérifier l'authentification
    if (!req.session.user || req.session.user.role !== 'student') {
      req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
      return res.redirect('/login');
    }
    
    res.render('student-exam-access', {
      user: req.session.user
    });
  } catch (err) {
    console.error('Erreur lors du chargement de la page:', err);
    req.flash('error', 'Erreur lors du chargement de la page');
    res.redirect('/student-dashboard');
  }
};

// Vérifier le code d'accès et commencer l'examen
// Fonction pour le contrôleur student avec correction pour la validation du code d'accès
exports.validateExamCode = async (req, res) => {
    try {
      // Vérifier l'authentification
      if (!req.session.user || req.session.user.role !== 'student') {
        req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
        return res.redirect('/login');
      }
      
      console.log("Tentative d'accès à l'examen avec le code:", req.body.accessCode);
      
      const accessCode = req.body.accessCode;
      
      if (!accessCode) {
        req.flash('error', 'Veuillez fournir un code d\'accès');
        return res.redirect('/student-exam-access');
      }
      
      // Vérifier si le code d'accès est valide
      const exam = await Exam.findOne({ 
        accessCode: accessCode, 
        isPublished: true
      });
      
      if (!exam) {
        console.log("Examen non trouvé avec le code:", accessCode);
        req.flash('error', 'Code d\'accès invalide ou examen non disponible');
        return res.redirect('/student-exam-access');
      }
      
      console.log("Examen trouvé:", exam.title);
      
      // Vérifier si l'examen est dans la période valide (si les dates sont définies)
      const now = new Date();
      
      if (exam.startTime && now < new Date(exam.startTime)) {
        req.flash('error', 'Cet examen n\'a pas encore commencé');
        return res.redirect('/student-exam-access');
      }
      
      if (exam.endTime && now > new Date(exam.endTime)) {
        req.flash('error', 'Cet examen est terminé');
        return res.redirect('/student-exam-access');
      }
      
      // Vérifier si l'étudiant a déjà terminé cet examen
      const existingCompletedSubmission = await StudentExamSubmission.findOne({
        student: req.session.user.id,
        exam: exam._id,
        status: 'completed'
      });
      
      if (existingCompletedSubmission) {
        req.flash('error', 'Vous avez déjà terminé cet examen');
        return res.redirect('/student-dashboard');
      }
      
      // Vérifier si l'étudiant a une soumission en cours
      let submission = await StudentExamSubmission.findOne({
        student: req.session.user.id,
        exam: exam._id,
        status: 'in-progress'
      });
      
      // Créer une nouvelle soumission d'examen si nécessaire
      if (!submission) {
        submission = new StudentExamSubmission({
          student: req.session.user.id,
          exam: exam._id,
          startTime: new Date(),
          currentQuestionIndex: 0,
          status: 'in-progress'
        });
        
        await submission.save();
        console.log("Nouvelle soumission créée:", submission._id);
      } else {
        console.log("Soumission existante trouvée:", submission._id);
      }
      
      // Rediriger vers la page de l'examen
      console.log("Redirection vers:", `/student-take-exam/${submission._id}`);
      return res.redirect(`/student-take-exam/${submission._id}`);
      
    } catch (err) {
      console.error('Erreur lors de la validation du code:', err);
      req.flash('error', 'Erreur lors de la validation du code: ' + err.message);
      return res.redirect('/student-exam-access');
    }
  };

// Enregistrer la géolocalisation
exports.saveGeolocation = async (req, res) => {
  try {
    const submissionId = req.params.submissionId;
    const { latitude, longitude, accuracy } = req.body;
    
    await StudentExamSubmission.findByIdAndUpdate(submissionId, {
      'geolocation.latitude': latitude,
      'geolocation.longitude': longitude,
      'geolocation.accuracy': accuracy,
      'geolocation.timestamp': new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement de la géolocalisation:', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la géolocalisation' });
  }
};

// Afficher la page d'examen avec question séquentielle
exports.takeExam = async (req, res) => {
  try {
    // Vérifier l'authentification
    if (!req.session.user || req.session.user.role !== 'student') {
      req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
      return res.redirect('/login');
    }
    
    const submissionId = req.params.submissionId;
    
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
    
    // Si aucun index de question actuel n'est défini, initialiser à 0
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
    req.flash('error', 'Erreur lors du chargement de l\'examen');
    res.redirect('/student-dashboard');
  }
};

// Passer à la question suivante
exports.nextQuestion = async (req, res) => {
  try {
    const submissionId = req.params.submissionId;
    
    // Récupérer la soumission
    const submission = await StudentExamSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ error: 'Soumission non trouvée' });
    }
    
    // Vérifier que l'étudiant est bien l'auteur de cette soumission
    if (submission.student.toString() !== req.session.user.id.toString()) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Récupérer l'examen avec les questions
    const exam = await Exam.findById(submission.exam).populate('questions');
    
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
    return res.status(500).json({ error: 'Erreur lors du passage à la question suivante' });
  }
};

// Enregistrer la réponse à une question
exports.saveAnswer = async (req, res) => {
  try {
    const submissionId = req.params.submissionId;
    const questionId = req.params.questionId;
    const { selectedOptions, textAnswer, timeTaken } = req.body;
    
    // Récupérer la soumission d'examen
    const submission = await StudentExamSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ error: 'Soumission non trouvée' });
    }
    
    // Vérifier que l'étudiant est bien l'auteur de cette soumission
    if (submission.student.toString() !== req.session.user.id.toString()) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Récupérer la question
    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({ error: 'Question non trouvée' });
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
        isCorrect = similarity >= (100 - question.tolerance) / 100;
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
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la réponse' });
  }
};

// Terminer l'examen
exports.finishExam = async (req, res) => {
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
};

// Afficher les résultats de l'examen
exports.examResults = async (req, res) => {
  try {
    // Vérifier l'authentification
    if (!req.session.user || req.session.user.role !== 'student') {
      req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
      return res.redirect('/login');
    }
    
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
};

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