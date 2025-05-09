// scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database'); // Make sure this path is correct
const { Exam, Question } = require('./models'); // Import models properly

const seed = async () => {
  try {
    await connectDB();

    // Dummy teacher ID
    const teacherId = new mongoose.Types.ObjectId();

    // Create exam
    const exam = new Exam({
      title: "Examen de Test",
      subject: "Géographie",
      description: "Examen pour tester la création de collections",
      accessCode: "ABC123",
      createdBy: teacherId,
      duration: 30,
      totalMarks: 1
    });

    const savedExam = await exam.save();

    // Create question
    const question = new Question({
      text: "Quelle est la capitale de la France ?",
      type: "multiple-choice",
      options: [
        { text: "Paris", isCorrect: true },
        { text: "Lyon", isCorrect: false },
        { text: "Marseille", isCorrect: false },
        { text: "Nice", isCorrect: false }
      ],
      points: 1,
      exam: savedExam._id
    });

    const savedQuestion = await question.save();

    // Link question to exam
    savedExam.questions.push(savedQuestion._id);
    await savedExam.save();

    console.log("✅ Exam et question insérés avec succès.");
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur de seed:', err);
    process.exit(1);
  }
};

seed();