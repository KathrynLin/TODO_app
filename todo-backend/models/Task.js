// models/Task.js
const mongoose = require('mongoose'); 

const TaskSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: String,
  category: {
    type: String,
    enum: ['work', 'personal', 'shopping'],
    default: 'personal'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: Date,
  completed: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Task', TaskSchema);