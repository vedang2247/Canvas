const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.issues = parsed.error.issues;
    return next(err);
  }
  req.body = parsed.data;
  next();
};

module.exports = validate;
