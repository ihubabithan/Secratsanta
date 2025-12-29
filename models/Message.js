const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  taskDescription: {
    type: String,
    required: [true, 'Please provide a task description'],
    trim: true,
    maxlength: [500, 'Task description cannot exceed 500 characters']
  },
  deadline: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    required: false
  },
  completedBy: {
    type: String, // 'user' or 'admin'
    required: false
  },
  markedIncompleteBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  markedIncompleteAt: {
    type: Date,
    required: false
  }
});

// Index for faster queries
messageSchema.index({ receiverId: 1 });

module.exports = mongoose.model('Message', messageSchema);
