const errorHandler = (err, req, res, next) => {
  // Mongoose CastError (invalid ObjectId format) → treat as 404
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({ error: 'Resource not found (invalid id format)' });
  }

  const statusCode = err.statusCode || 500;
  const payload = { error: err.message || 'Internal Server Error' };

  if (err.issues) {
    payload.details = err.issues; // include Zod issues if present
  }

  // Do not leak stack traces in production
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json(payload);
};

module.exports = errorHandler;
