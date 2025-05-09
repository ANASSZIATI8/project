// models/StudentExamSubmission.js
const mongoose = require('mongoose');

const StudentExamSubmissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'timed-out'],
    default: 'in-progress'
  },
  completed: {
    type: Boolean,
    default: false
  },
  answers: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    selectedOptions: [{
      type: String
    }],
    textAnswer: {
      type: String
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    points: {
      type: Number,
      default: 0
    },
    timeTaken: {
      type: Number,
      default: 0
    },
    submittedAt: {
      type: Date
    }
  }],
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  geolocation: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date
  },
  totalScore: {
    type: Number,
    default: 0
  },
  percentageScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentExamSubmission', StudentExamSubmissionSchema);