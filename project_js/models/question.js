// models/question.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['mcq', 'direct'],
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: String,
  tolerance: {
    type: Number,
    default: 10 // Pourcentage de tolérance pour erreurs de frappe/casse
  },
  points: {
    type: Number,
    default: 1,
    required: true
  },
  duration: {
    type: Number,
    default: 60, // en secondes
    required: true
  },
  media: {
    type: {
      type: String,
      enum: ['image', 'audio', 'video']
    },
    url: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Question', questionSchema);