const mongoose = require('mongoose');

const StudentExamSubmissionSchema = new mongoose.Schema({
  exam: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Exam', 
    required: true 
  },
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  answers: [{
    question: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Question' 
    },
    // For multiple choice
    selectedOptions: [Number],
    // For short answer
    textAnswer: String,
    // For true-false
    booleanAnswer: Boolean,
    // Common fields
    isCorrect: Boolean,
    marksObtained: Number,
    feedback: String
  }],
  totalScore: { 
    type: Number, 
    default: 0 
  },
  percentage: {
    type: Number,
    default: 0
  },
  passed: { 
    type: Boolean, 
    default: false 
  },
  startedAt: { 
    type: Date,
    default: Date.now
  },
  submittedAt: Date,
  timeSpent: Number, // in minutes
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'evaluated', 'expired'],
    default: 'in-progress'
  }
}, { timestamps: true });

// Calculate total score and passed status before saving
StudentExamSubmissionSchema.pre('save', async function(next) {
  try {
    if (this.status === 'submitted' && !this.submittedAt) {
      this.submittedAt = new Date();
      
      // Calculate time spent
      if (this.startedAt) {
        const timeDiff = this.submittedAt - this.startedAt;
        this.timeSpent = Math.round(timeDiff / (1000 * 60)); // convert to minutes
      }
    }
    
    // Calculate total score if answers are evaluated
    if (this.status === 'evaluated') {
      const totalScore = this.answers.reduce((sum, answer) => sum + (answer.marksObtained || 0), 0);
      this.totalScore = totalScore;
      
      // Get exam to check passing marks
      const Exam = mongoose.model('Exam');
      const exam = await Exam.findById(this.exam);
      
      if (exam) {
        this.percentage = (this.totalScore / exam.totalMarks) * 100;
        this.passed = this.totalScore >= exam.passingMarks;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

const StudentExamSubmission = mongoose.model('StudentExamSubmission', StudentExamSubmissionSchema);

module.exports = StudentExamSubmission;