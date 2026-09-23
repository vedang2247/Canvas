const Canvas = require('../models/Canvas');

// POST /api/canvases
// Body has already been validated + coerced by the validate middleware.
const createCanvas = async (req, res, next) => {
  try {
    const canvas = new Canvas(req.body);
    const saved = await canvas.save();
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};

// GET /api/canvases
// Returns lightweight summaries — no elements bloat on the list view.
const listCanvases = async (req, res, next) => {
  try {
    const canvases = await Canvas.find({}, 'name createdAt updatedAt').sort({
      updatedAt: -1,
    });
    res.status(200).json(canvases);
  } catch (err) {
    next(err);
  }
};

module.exports = { createCanvas, listCanvases };
