const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Create a mongoose schema
const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Nom is required']
  },
  prenom: {
    type: String,
    required: [true, 'Prénom is required']
  },
  dateNaissance: {
    type: Date,
    required: [true, 'Date de naissance is required']
  },
  sexe: {
    type: String,
    enum: ['M', 'F'],
    required: [true, 'Sexe is required']
  },
  etablissement: {
    type: String,
    required: [true, 'Établissement is required']
  },
  filiere: {
    type: String,
    required: [true, 'Filière is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  institution: {
    type: String,
    required: true
  },
  filiere: {
    type: String,
    required: true
  }
  
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create and export the User model
const User = mongoose.model('User', userSchema);

module.exports = User;