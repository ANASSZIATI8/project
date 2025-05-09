// routes/question.js
const express = require('express');
const router = express.Router();
const Question = require('../models/question');
const Exam = require('../models/exam');
const { isAuthenticated } = require('../middleware/auth');

// Create a new question
router.post('/questions', isAuthenticated, async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    
    // If this question is for an exam, add it to the exam's questions array
    if (req.body.exam) {
      await Exam.findByIdAndUpdate(
        req.body.exam,
        { $push: { questions: question._id } }
      );
    }
    
    res.status(201).json(question);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get question by ID
router.get('/questions/:id', isAuthenticated, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update question
router.put('/questions/:id', isAuthenticated, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json(question);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete question
router.delete('/questions/:id', isAuthenticated, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    
    // Also remove the question from any exam that contains it
    await Exam.updateMany(
      { questions: req.params.id },
      { $pull: { questions: req.params.id } }
    );
    
    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;