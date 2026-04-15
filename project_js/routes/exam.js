// routes/exam.js (updateé avec la route de suppression)
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Exam = require('../models/exam');
const Question = require('../models/question');
const StudentExamSubmission = require('../models/StudentExamSubmission');
const { isAuthenticated } = require('../middleware/auth');
const examController = require('../controllers/examController');
const teacherStudentsController = require('../controllers/teacherStudentsController'); // Import ajouté

// Correction du chemin vers la base de données
const connectDB = require('../config/database');

// Get exam by access code
router.get('/exams/code/:code', async (req, res) => {
    try {
        const exam = await Exam.findOne({ accessCode: req.params.code }).populate('questions');
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get exam by ID
router.get('/exams/:id', isAuthenticated, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id).populate('questions');
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update exam
router.put('/exams/:id', isAuthenticated, async (req, res) => {
    try {
        const exam = await Exam.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete exam - ROUTE MISE À JOUR ET CORRIGÉE
router.post('/teacher-exams/:id/delete', isAuthenticated, async (req, res) => {
    try {
        // Check if user is logged in and is a teacher
        if (!req.session.user || req.session.user.role !== 'teacher') {
            req.flash('error', 'Veuillez vous connecter en tant qu\'enseignant pour gérer les examens');
            return res.redirect('/login');
        }
        
        const examId = req.params.id;
        
        // Vérifier que l'ID est valide
        if (!mongoose.Types.ObjectId.isValid(examId)) {
            req.flash('error', 'ID d\'examen invalide');
            return res.redirect('/teacher-exams');
        }
        
        const exam = await Exam.findById(examId);
        if (!exam) {
            req.flash('error', 'Examen non trouvé');
            return res.redirect('/teacher-exams');
        }
        
        // Convert both IDs to strings for safe comparison
        const examCreatorId = exam.createdBy ? exam.createdBy.toString() : null;
        const teacherId = req.session.user.id.toString();
        
        // Check if this teacher owns this exam
        if (examCreatorId !== teacherId) {
            req.flash('error', 'Vous n\'avez pas la permission de supprimer cet examen');
            return res.redirect('/teacher-exams');
        }
        
        // Procéder à la suppression
        try {
            // 1. Supprimer toutes les questions associées à cet examen
            if (exam.questions && exam.questions.length > 0) {
                await Question.deleteMany({ _id: { $in: exam.questions } });
            }
            
            // 2. Supprimer toutes les soumissions associées à cet examen
            await StudentExamSubmission.deleteMany({ exam: examId });
            
            // 3. Supprimer l'examen lui-même
            await Exam.findByIdAndDelete(examId);
            
            req.flash('success', `L'examen "${exam.title}" a été supprimé avec succès`);
            
            // Si la requête vient d'AJAX, renvoyer une réponse JSON
            if (req.xhr || req.headers.accept && req.headers.accept.indexOf('json') > -1) {
                return res.json({ success: true, message: 'Examen supprimé avec succès' });
            }
            
            // Sinon, rediriger vers la page des examens
            res.redirect('/teacher-exams');
        } catch (deleteError) {
            console.error('Erreur pendant la suppression:', deleteError);
            req.flash('error', 'Erreur lors de la suppression: ' + deleteError.message);
            
            if (req.xhr || req.headers.accept && req.headers.accept.indexOf('json') > -1) {
                return res.status(500).json({ success: false, error: deleteError.message });
            }
            
            res.redirect('/teacher-exams');
        }
    } catch (err) {
        console.error('Error deleting exam:', err);
        req.flash('error', `Erreur lors de la suppression de l'examen: ${err.message}`);
        
        if (req.xhr || req.headers.accept && req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ success: false, error: err.message });
        }
        
        res.redirect('/teacher-exams');
    }
});

// Create exam - Route modifiée
router.post('/teacher-exams/create', async (req, res) => {
    // Check if user is logged in and is a teacher
    if (!req.session.user || req.session.user.role !== 'teacher') {
        req.flash('error', 'Veuillez vous connecter en tant qu\'enseignant pour créer des examens');
        return res.redirect('/login');
    }
    
    try {
        console.log('Form data received:', req.body);
        console.log('Teacher ID for exam creation:', req.session.user.id);
        console.log('Teacher role:', req.session.user.role);
        
        // Ensure database connection
        await connectDB();
        
        // Generate a unique access code
        const accessCode = require('crypto').randomBytes(4).toString('hex').toUpperCase();
        
        // Convert the user ID to ObjectId
        let teacherId;
        try {
            teacherId = new mongoose.Types.ObjectId(req.session.user.id);
        } catch (err) {
            console.error('Error converting ID to ObjectId, using string ID instead:', err);
            teacherId = req.session.user.id.toString();
        }
        
        // Create the new exam with the form data
        const exam = new Exam({
            title: req.body.title,
            subject: req.body.subject,
            description: req.body.description || '',
            accessCode: accessCode,
            createdBy: teacherId, // Now using ObjectId
            duration: parseInt(req.body.duration) || 60,
            totalMarks: parseInt(req.body.totalMarks) || 100,
            questions: [],
            isPublished: false, // Default to unpublished
            // Add additional fields from the form
            major: req.body.major,
            passingMarks: parseInt(req.body.passingMarks) || 50,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            instructions: req.body.instructions,
            shuffleQuestions: req.body.shuffleQuestions === 'on',
            allowReview: req.body.allowReview === 'on',
            createdAt: new Date()
        });
        
        // Save the exam to the database with explicit promise handling
        const savedExam = await exam.save();
        console.log('Exam saved successfully:', savedExam);
        console.log('Saved exam with createdBy:', savedExam.createdBy.toString());
        console.log('Is ObjectId?', typeof savedExam.createdBy === 'object');
        
        // Verify the exam was saved by querying it back
        const retrievedExam = await Exam.findById(savedExam._id);
        console.log('Exam retrieved from database:', retrievedExam ? 'Success' : 'Not found');
        
        // Count all exams to verify
        const examCount = await Exam.countDocuments();
        console.log(`Total exams in database after save: ${examCount}`);
        
        // Check all exams to debug
        const allExams = await Exam.find({});
        console.log('All exams createdBy values:', allExams.map(e => ({
            title: e.title,
            createdBy: e.createdBy ? e.createdBy.toString() : 'None'
        })));
        
        // Set flash message for success
        req.flash('success', `Examen "${exam.title}" créé avec succès. Code d'accès: ${accessCode}`);
        
        // Redirection vers la page des examens au lieu du tableau de bord
        res.redirect('/teacher-exams');
    } catch (err) {
        console.error('Error in exam creation process:', err);
        
        // Set flash message for error
        req.flash('error', `Erreur lors de la création de l'examen: ${err.message}`);
        
        // Redirection vers la page de création d'examen en cas d'erreur
        res.redirect('/teacher-create-exam');
    }
});

// Routes pour accéder aux examens spécifiques - Modifiées
router.get('/teacher-exams/:id', isAuthenticated, examController.getExamById);
router.get('/teacher-exams', isAuthenticated, examController.getExam);

// Toggle exam published status - Route modifiée
router.post('/teacher-exams/:id/toggle', isAuthenticated, async (req, res) => {
    try {
        // Check if user is logged in and is a teacher
        if (!req.session.user || req.session.user.role !== 'teacher') {
            req.flash('error', 'Veuillez vous connecter en tant qu\'enseignant pour gérer les examens');
            return res.redirect('/login');
        }
        
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            req.flash('error', 'Examen non trouvé');
            return res.redirect('/teacher-exams');
        }
        
        // Convert both IDs to strings for safe comparison
        const examCreatorId = exam.createdBy ? exam.createdBy.toString() : null;
        const teacherId = req.session.user.id.toString();
        
        // Check if this teacher owns this exam
        if (examCreatorId !== teacherId) {
            req.flash('error', 'Vous n\'avez pas la permission de modifier cet examen');
            return res.redirect('/teacher-exams');
        }
        
        // Toggle isPublished status (true to false, false to true)
        exam.isPublished = !exam.isPublished;
        await exam.save();
        
        req.flash('success', `L'examen "${exam.title}" a été ${exam.isPublished ? 'activé' : 'désactivé'}`);
        res.redirect('/teacher-exams');
    } catch (err) {
        console.error('Error toggling exam status:', err);
        req.flash('error', `Erreur lors de la modification du statut: ${err.message}`);
        res.redirect('/teacher-exams');
    }
});

// Routes additionnelles pour examens
router.get('/teacher-exams/:id/edit', isAuthenticated, async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'teacher') {
            req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
            return res.redirect('/login');
        }
        
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            req.flash('error', 'Examen non trouvé');
            return res.redirect('/teacher-exams');
        }
        
        // Verify ownership
        const examCreatorId = exam.createdBy ? exam.createdBy.toString() : null;
        const teacherId = req.session.user.id.toString();
        
        if (examCreatorId !== teacherId) {
            req.flash('error', 'Vous n\'avez pas la permission de modifier cet examen');
            return res.redirect('/teacher-exams');
        }
        
        res.render('teacher-edit-exam', {
            user: req.session.user,
            exam,
            formData: exam
        });
    } catch (err) {
        console.error('Erreur lors du chargement de l\'examen:', err);
        req.flash('error', 'Erreur lors du chargement de l\'examen');
        res.redirect('/teacher-exams');
    }
});

// ROUTE MODIFIÉE - Redirection vers teacher-students-validated
router.get('/teacher-exams/:id/results', isAuthenticated, async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'teacher') {
            req.flash('error', 'Veuillez vous connecter pour accéder à cette page');
            return res.redirect('/login');
        }
        
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            req.flash('error', 'Examen non trouvé');
            return res.redirect('/teacher-exams');
        }
        
        // Verify ownership
        const examCreatorId = exam.createdBy ? exam.createdBy.toString() : null;
        const teacherId = req.session.user.id.toString();
        
        if (examCreatorId !== teacherId) {
            req.flash('error', 'Vous n\'avez pas la permission de voir ces résultats');
            return res.redirect('/teacher-exams');
        }
        
        // Rediriger vers teacher-students-validated avec le filtre exam
        res.redirect(`/teacher-students-validated?exam=${req.params.id}`);
    } catch (err) {
        console.error('Erreur lors du chargement des résultats:', err);
        req.flash('error', 'Erreur lors du chargement des résultats');
        res.redirect('/teacher-exams');
    }
});

// Route API pour obtenir les détails d'un résultat
router.get('/teacher-results/:id/api', isAuthenticated, teacherStudentsController.getResultDetailsAPI);

// Routes pour teacher-students-validated
router.get('/teacher-students-validated', isAuthenticated, teacherStudentsController.getStudentsValidated);
router.get('/teacher-students-validated/:id', isAuthenticated, teacherStudentsController.getStudentValidatedById);
router.get('/teacher-students-validated/:id/api', isAuthenticated, teacherStudentsController.getStudentValidatedByIdAPI);

module.exports = router;