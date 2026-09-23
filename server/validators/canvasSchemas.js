const { z } = require('zod');

// ---------------------------------------------------------------------------
// Element sub-schemas (one per type, using discriminatedUnion)
// ---------------------------------------------------------------------------

const baseElementFields = {
  id: z.string().min(1, 'Element id is required'),
  x: z.number().default(0),
  y: z.number().default(0),
  rotation: z.number().default(0),
  zIndex: z.number().int().default(0),
  fill: z.string().default('#6366f1'),
};

const rectElementSchema = z.object({
  ...baseElementFields,
  type: z.literal('rect'),
  width: z.number().positive(),
  height: z.number().positive(),
});

const circleElementSchema = z.object({
  ...baseElementFields,
  type: z.literal('circle'),
  radius: z.number().positive(),
});

const textElementSchema = z.object({
  ...baseElementFields,
  type: z.literal('text'),
  text: z.string().default(''),
  fontSize: z.number().positive().default(16),
});

// Discriminated union — Zod picks the right schema based on `type`
const elementSchema = z.discriminatedUnion('type', [
  rectElementSchema,
  circleElementSchema,
  textElementSchema,
]);

// ---------------------------------------------------------------------------
// Canvas-level schemas
// ---------------------------------------------------------------------------

const createCanvasSchema = z.object({
  name: z.string().min(1, 'Canvas name is required'),
  elements: z.array(elementSchema).default([]),
});

// Both fields optional for partial updates
const updateCanvasSchema = createCanvasSchema.partial();

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  elementSchema,
  createCanvasSchema,
  updateCanvasSchema,
};
