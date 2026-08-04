/**
 * Express middleware to validate request bodies against a Zod schema
 * @param {import('zod').ZodSchema} schema 
 */
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    // Zod v3 exposes validation errors under `.issues`
    const zodIssues = err.issues || err.errors;
    if (zodIssues && zodIssues.length > 0) {
      const formattedErrors = zodIssues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      return res.status(400).json({
        error: 'Validation failed',
        details: formattedErrors
      });
    }
    res.status(400).json({ error: 'Invalid request payload' });
  }
};

module.exports = { validate };
