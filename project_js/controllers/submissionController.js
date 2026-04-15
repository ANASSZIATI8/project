const StudentExamSubmission = require('../models/StudentExamSubmission');
const Exam = require('../models/exam');
const Question = require('../models/question');

exports.submitExam = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const exam = await Exam.findById(examId).populate('questions');

    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    let score = 0;

    for (const ans of answers) {
      const question = exam.questions.find(q => q._id.toString() === ans.questionId);
      const correctOption = question.options.find((opt, idx) => opt.isCorrect && idx === ans.selectedOption);
      if (correctOption) score += question.marks;
    }

    const passed = score >= Math.floor(exam.totalMarks * 0.5); // Or set a "passingMarks" field

    const submission = new StudentExamSubmission({
      exam: examId,
      student: req.user._id,
      answers,
      score,
      passed,
      startedAt: req.body.startedAt,
      submittedAt: new Date()
    });

    await submission.save();
    res.status(201).json({ message: 'Submission saved', score, passed });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
