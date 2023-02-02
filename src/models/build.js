const mongoose = require('mongoose');

const BuildSchema = mongoose.Schema({
  status: String,
  createdAt: Date,
  startedAt: Date,
  endedAt: Date,
  duration: Number,
  jobId: String,
  authorName: String,
  authorId: String,
});

module.exports = mongoose.model('Build', BuildSchema);
