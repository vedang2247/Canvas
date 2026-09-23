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

// GET /api/canvases/:id
const getCanvas = async (req, res, next) => {
  try {
    const canvas = await Canvas.findById(req.params.id);
    if (!canvas) {
      const err = new Error('Canvas not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json(canvas);
  } catch (err) {
    next(err);
  }
};

// PUT /api/canvases/:id
// `new: true`          → return the updated document, not the pre-update one.
// `runValidators: true` → re-run Mongoose schema validators on the new data.
const updateCanvas = async (req, res, next) => {
  try {
    const canvas = await Canvas.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!canvas) {
      const err = new Error('Canvas not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json(canvas);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/canvases/:id
const deleteCanvas = async (req, res, next) => {
  try {
    const canvas = await Canvas.findByIdAndDelete(req.params.id);
    if (!canvas) {
      const err = new Error('Canvas not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createCanvas, listCanvases, getCanvas, updateCanvas, deleteCanvas };
