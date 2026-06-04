const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Project title is required'], trim: true },
    description: { type: String, default: '', trim: true },
    status: { type: String, enum: ['planning', 'active', 'on-hold', 'completed'], default: 'planning' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'editor' },
      },
    ],
    dueDate: { type: Date, default: null },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);