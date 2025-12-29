const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  score: {
    type: Number,
    default: 0
  },
  tasksCompleted: {
    type: Number,
    default: 0
  },
  tasksIncomplete: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
leaderboardSchema.index({ score: -1 });
leaderboardSchema.index({ userId: 1 });

// Method to update score
leaderboardSchema.methods.addCompletedTask = function() {
  this.score += 5;
  this.tasksCompleted += 1;
  this.lastUpdated = Date.now();
  return this.save();
};

leaderboardSchema.methods.addIncompleteTask = function() {
  this.score -= 5;
  this.tasksIncomplete += 1;
  this.lastUpdated = Date.now();
  return this.save();
};

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
