import { ZodError } from 'zod';

/**
 * Validation middleware factory
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export const validate = (schema, source = 'body') => {
  // Safety check – prevents silent crashes
  if (!schema || typeof schema.parseAsync !== 'function') {
    throw new Error('validate() expects a valid Zod schema');
  }

  return async (req, res, next) => {
    try {
      const data = req[source];
      const validatedData = await schema.parseAsync(data);

      if (source === 'body') {
        req.validatedData = validatedData;
      } else if (source === 'params') {
        req.params = { ...req.params, ...validatedData };
      } else if (source === 'query') {
        req.query = { ...req.query, ...validatedData };
      }

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }

      // Unexpected error
      return res.status(500).json({
        success: false,
        message: 'Validation error',
        error: error.message,
      });
    }
  };
};

/**
 * Manual validation function
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {Object} data - Data to validate
 * @returns {Promise<Object>} Validated data or throws ZodError
 */
export const validateData = async (schema, data) => {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((err) => ({
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
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
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
        errors: error.issues.map((err) => ({
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
