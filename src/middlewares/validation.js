
import { ZodError } from 'zod';
import catchAsync from '../utils/catchAsync.js';

/**
 * Validation middleware factory
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export const validate = (schema) => catchAsync(async (req, res, next) => {
  // Validate request body
  const validatedData = await schema.parseAsync(req.body);
  // Replace body with validated data
  req.validatedData = validatedData;
  return next();
});

/**
 * Manual validation function
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @param {Object} data - Data to validate
 * @returns {Promise<Object>} Validated data or throws ZodError
 */
export const validateData = async (schema, data) => {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new Error(JSON.stringify(formattedErrors));
    }
    throw error;
  }
};

/**
 * Safe validation function - returns result object instead of throwing
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @param {Object} data - Data to validate
 * @returns {Promise<{success: boolean, data?: Object, errors?: Array}>}
 */
export const safeValidate = async (schema, data) => {
  try {
    const validated = await schema.parseAsync(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: error.message }],
    };
  }
};
