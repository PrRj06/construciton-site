// models/Update.js
const { mongoose } = require('../config/db');

const updateSchema = new mongoose.Schema({
  date:               { type: String, required: true },
  siteName:           { type: String, required: true },
  workDone:           { type: String, required: true },
  numberOfWorkers:    { type: Number, required: true },
  materialsUsed:      { type: String, required: true },
  progressPercentage: { type: Number, required: true, min: 0, max: 100 },
  // photoPath stores the file path of the uploaded image (optional)
  photoPath:          { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.models.Update || mongoose.model('Update', updateSchema);
