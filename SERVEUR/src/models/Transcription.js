// models/Transcription.js

const mongoose = require('mongoose');

const transcriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  filename: {
    type: String,
    required: true
  },

  result: {
    type: String // texte de la transcription
  },

  summary: {
    type: String // résumé de la transcription
  },

  status: {
    type: String,
    enum: ['pending', 'done', 'error'],
    default: 'pending'
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Transcription', transcriptionSchema);