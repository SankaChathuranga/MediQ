/**
 * validate.js — Zod validation middleware factory
 *
 * Usage in any route file:
 *   const { validate } = require('../middleware/validate');
 *   const { z } = require('zod');
 *
 *   const MySchema = z.object({ name: z.string().min(1) });
 *
 *   router.post('/', validate(MySchema), async (req, res) => {
 *     // req.body is already validated and typed
 *   });
 */

const { ZodError } = require('zod');

/**
 * Returns Express middleware that validates req.body against the given Zod schema.
 * On failure, responds 400 with { success: false, error: { message, field } }.
 *
 * @param {import('zod').ZodSchema} schema
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const first = err.errors[0];
        return res.status(400).json({
          success: false,
          error: {
            message: first.message,
            field: first.path.join('.'),
          },
        });
      }
      next(err);
    }
  };
}

module.exports = { validate };
