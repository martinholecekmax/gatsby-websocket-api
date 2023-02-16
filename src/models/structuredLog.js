const mongoose = require("mongoose");

const StructuredLogSchema = mongoose.Schema({
  message: String,
  duration: Number,
  buildId: String,
  level: String,
  status: String,
});

module.exports = mongoose.model("StructuredLog", StructuredLogSchema);
