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
  }
});

// Index for faster queries
messageSchema.index({ receiverId: 1 });

module.exports = mongoose.model('Message', messageSchema);
