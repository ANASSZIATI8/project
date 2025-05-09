// routes/submission.js
const express = require('express');
const router = express.Router();
const StudentExamSubmission = require('../models/StudentExamSubmission');
const { isAuthenticated } = require('../middleware/auth');

// Submit an exam
router.post('/submissions', isAuthenticated, async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const submission = new StudentExamSubmission({
      exam: examId,
      student: req.session.user.id,
      answers,
      startedAt: req.body.startedAt,
      submittedAt: new Date(),
      status: 'submitted'
    });
    
    await submission.save();
    res.status(201).json({ message: 'Submission saved', submission });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all submissions for a student
router.get('/submissions/student', isAuthenticated, async (req, res) => {
  try {
    const submissions = await StudentExamSubmission.find({ student: req.session.user.id })
      .populate('exam')
      .sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all submissions for an exam (teacher only)
router.get('/submissions/exam/:examId', isAuthenticated, async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.session.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const submissions = await StudentExamSubmission.find({ exam: req.params.examId })
      .populate('student', 'nom prenom email')
      .sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific submission
router.get('/submissions/:id', isAuthenticated, async (req, res) => {
  try {
    const submission = await StudentExamSubmission.findById(req.params.id)
      .populate('exam')
      .populate('student', 'nom prenom email');
    
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    
    // Check if user is authorized to view this submission
    if (
      req.session.user.role !== 'teacher' && 
      submission.student._id.toString() !== req.session.user.id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;