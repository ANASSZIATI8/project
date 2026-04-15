// scripts/test-db.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');

const testDB = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Define a test schema and model
    const TestSchema = new mongoose.Schema({
      name: String,
      date: { type: Date, default: Date.now }
    });
    
    // Remove the model if it exists (to avoid model overwrite warnings)
    mongoose.modelNames().forEach((modelName) => {
      if (modelName === 'TestModel') {
        delete mongoose.models[modelName];
      }
    });
    
    const TestModel = mongoose.model('TestModel', TestSchema);
    
    // Create a test document
    const testDoc = new TestModel({ name: 'Test Document' });
    await testDoc.save();
    console.log('Test document saved:', testDoc);
    
    // Read the document back
    const foundDoc = await TestModel.findById(testDoc._id);
    console.log('Test document found:', foundDoc);
    
    // List all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('All collections in database:', collections.map(c => c.name));
    
    // Check if the exams collection exists
    if (collections.some(c => c.name === 'exams')) {
      // Read from the exams collection
      const Exam = require('./models/exam');
      const exams = await Exam.find({});
      console.log(`Found ${exams.length} exams in database:`);
      exams.forEach(exam => console.log('- ' + exam.title));
    } else {
      console.log('No exams collection found in the database yet');
    }
    
    // Cleanup and close connection
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('Test document removed');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    console.log('Database test completed successfully');
  } catch (error) {
    console.error('Database test failed:', error);
    process.exit(1);
  }
};

testDB();