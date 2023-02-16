const mongoose = require("mongoose");

const LogSchema = mongoose.Schema({
  timestamp: Date,
  message: String,
  command: String,
  sourceStream: String,
  buildId: String,
});

module.exports = mongoose.model("Log", LogSchema);
