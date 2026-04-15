// models/exam.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExamSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  description: String,
  accessCode: {
    type: String,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'user', // Référence correcte au modèle user (minuscule)
    required: true
  },
  duration: Number,
  totalMarks: {
    type: Number,
    default: 0
  },
  questions: [{
    type: Schema.Types.ObjectId,
    ref: 'Question'
  }],
  major: String,
  passingMarks: Number,
  startTime: Date,
  endTime: Date,
  instructions: String,
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  allowReview: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Exam', ExamSchema);