const mongoose = require('mongoose');

// Sub-schema for individual canvas elements
const canvasElementSchema = new mongoose.Schema(
  {
    // --- Shared fields ---
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['rect', 'circle', 'text'],
      required: true,
    },
    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 },
    rotation: { type: Number, default: 0 },
    zIndex: { type: Number, default: 0 },
    fill: { type: String, default: '#6366f1' },

    // --- Rect-specific ---
    width: { type: Number },
    height: { type: Number },

    // --- Circle-specific ---
    radius: { type: Number },

    // --- Text-specific ---
    text: { type: String },
    fontSize: { type: Number },
  },
  { _id: false } // No separate _id for sub-documents
);

// Top-level Canvas schema
const canvasSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    elements: { type: [canvasElementSchema], default: [] },
  },
  { timestamps: true }
);

// Index for efficient listing queries
canvasSchema.index({ name: 1 });
canvasSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Canvas', canvasSchema);
