const express = require('express');
const {
  createCanvas,
  listCanvases,
  getCanvas,
  updateCanvas,
  deleteCanvas,
} = require('../controllers/canvasController');
const validate = require('../middleware/validate');
const {
  createCanvasSchema,
  updateCanvasSchema,
} = require('../validators/canvasSchemas');

const router = express.Router();

router.post('/', validate(createCanvasSchema), createCanvas);
router.get('/', listCanvases);
router.get('/:id', getCanvas);
router.put('/:id', validate(updateCanvasSchema), updateCanvas);
router.delete('/:id', deleteCanvas);

module.exports = router;
