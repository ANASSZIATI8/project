const Exam = require('../models/exam');
const Question = require('../models/question');
const StudentExamSubmission = require('../models/StudentExamSubmission');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

exports.createExam = async (req, res) => {
    try {
        const accessCode = uuidv4().split('-')[0].toUpperCase();
        
        const createdBy = req.session.user ? req.session.user.id : null;
        
        if (!createdBy) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        const exam = new Exam({ 
            ...req.body, 
            createdBy: new mongoose.Types.ObjectId(createdBy), 
            accessCode 
        });
        
        await exam.save();
        
        // Si c'est une requête API, renvoyer une réponse JSON
        if (req.xhr || req.headers.accept && req.headers.accept.indexOf('json') > -1) {
            res.status(201).json({ message: 'Exam created successfully', accessCode });
        } else {
            // Redirection vers les examens au lieu du tableau de bord
            req.flash('success', `Examen "${exam.title}" créé avec succès. Code d'accès: ${accessCode}`);
            res.redirect('/teacher-exams');
        }
    } catch (err) {
        console.error('Error creating exam:', err);
        
        // Si c'est une requête API, renvoyer une réponse JSON
        if (req.xhr || req.headers.accept && req.headers.accept.indexOf('json') > -1) {
            res.status(400).json({ error: err.message });
        } else {
            // Redirection vers la page de création avec une erreur
            req.flash('error', `Erreur lors de la création de l'examen: ${err.message}`);
            res.redirect('/teacher-create-exam');
        }
    }
};

exports.getExamByAccessCode = async (req, res) => {
    try {
        const exam = await Exam.findOne({ accessCode: req.params.code }).populate('questions');
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Fonction corrigée pour récupérer les examens par enseignant
exports.getExamsByTeacher = async (teacherId) => {
    try {
        console.log('Recherche des examens pour l\'enseignant:', teacherId);
        
        // Essayez la requête directe avec correction du 'new'
        try {
            const teacherObjectId = new mongoose.Types.ObjectId(teacherId); // Correction: Ajout du mot-clé 'new'
            const exams = await Exam.find({ createdBy: teacherObjectId }).sort({ createdAt: -1 });
            console.log(`Trouvé ${exams.length} examens avec requête directe`);
            
            if (exams.length > 0) {
                return exams;
            }
        } catch (err) {
            console.log('Erreur lors de la requête directe:', err);
        }
        
        // Plan B: récupérer tous les examens et filtrer manuellement
        console.log("Aucun examen trouvé, essai avec filtrage manuel");
        const allExams = await Exam.find({});
        console.log('Total des examens trouvés:', allExams.length);
        
        const teacherExams = allExams.filter(exam => {
            const examCreatorId = exam.createdBy ? exam.createdBy.toString() : null;
            const matches = examCreatorId === teacherId.toString();
            console.log(`Comparaison pour "${exam.title}": ${examCreatorId} vs ${teacherId} = ${matches}`);
            return matches;
        });
        
        return teacherExams.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (err) {
        console.error('Erreur lors de la récupération des examens:', err);
        return [];
    }
};

exports.getExamById = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id).populate('questions');
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
};

// Fonction corrigée getExam
exports.getExam = async (req, res) => {
    console.log("Récupération des examens pour l'enseignant:", req.session.user);

    try {
        // Récupérer les examens
        const exams = await exports.getExamsByTeacher(req.session.user.id);
        console.log("Fetched exams:", exams);
        
        // Ajouter les variables nécessaires pour le template
        res.render('teacher-dashboard', { 
            exams: exams,
            examCount: exams.length, 
            studentCount: 0,
            stats: {
                examsCount: exams.length,
                submissionsCount: 0,
                averageScore: 0
            },
            user: req.session.user
        });
    } catch (err) {
        console.error('Error fetching exams:', err);
        req.flash('error', `Erreur lors de la récupération des examens: ${err.message}`);
        res.redirect('/teacher-dashboard');
    }
};

exports.updateExam = async (req, res) => {
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
};

// Fonction de suppression d'examen 
exports.deleteExam = async (req, res) => {
    try {
        // Vérifier l'authentification
        if (!req.session.user || req.session.user.role !== 'teacher') {
            req.flash('error', 'Veuillez vous connecter en tant qu\'enseignant pour supprimer des examens');
            return res.redirect('/login');
        }
        
        // Trouver l'examen
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            req.flash('error', 'Examen non trouvé');
            return res.redirect('/teacher-exams');
        }
        
        // Vérifier que l'enseignant est bien le créateur de cet examen
        const examCreatorId = exam.createdBy ? exam.createdBy.toString() : null;
        const teacherId = req.session.user.id.toString();
        
        if (examCreatorId !== teacherId) {
            req.flash('error', 'Vous n\'avez pas la permission de supprimer cet examen');
            return res.redirect('/teacher-exams');
        }
        
        // Supprimer toutes les questions associées à cet examen
        await Question.deleteMany({ _id: { $in: exam.questions } });
        
        // Supprimer toutes les soumissions associées à cet examen
        await StudentExamSubmission.deleteMany({ exam: exam._id });
        
        // Supprimer l'examen
        await Exam.findByIdAndDelete(req.params.id);
        
        req.flash('success', `L'examen "${exam.title}" a été supprimé avec succès`);
        res.redirect('/teacher-exams');
    } catch (err) {
        console.error('Error deleting exam:', err);
        req.flash('error', `Erreur lors de la suppression de l'examen: ${err.message}`);
        res.redirect('/teacher-exams');
    }
};

exports.toggleExamStatus = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            req.flash('error', 'Examen non trouvé');
            return res.redirect('/teacher-exams');
        }
        
        // Vérifier si cet enseignant est bien le créateur de l'examen
        const examCreatorId = exam.createdBy ? exam.createdBy.toString() : null;
        const teacherId = req.session.user.id.toString();
        
        if (examCreatorId !== teacherId) {
            req.flash('error', 'Vous n\'avez pas la permission de modifier cet examen');
            return res.redirect('/teacher-exams');
        }
        
        // Inverser le statut isPublished
        exam.isPublished = !exam.isPublished;
        await exam.save();
        
        req.flash('success', `L'examen "${exam.title}" a été ${exam.isPublished ? 'activé' : 'désactivé'}`);
        res.redirect('/teacher-exams');
    } catch (err) {
        console.error('Error toggling exam status:', err);
        req.flash('error', `Erreur lors de la modification du statut: ${err.message}`);
        res.redirect('/teacher-exams');
    }
};