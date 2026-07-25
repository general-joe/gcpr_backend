import { ZodError } from 'zod';

const formatPath = (path) => path.length ? path.join('.') : 'body';

const formatZodIssue = (err) => ({
  field: formatPath(err.path),
  message: err.message,
  code: err.code,
  received: err.received,
  expected: err.expected,
});

const summarizeValidation = (errors) => {
  if (!errors.length) return 'Validation failed';
  if (errors.length === 1) return `${errors[0].field}: ${errors[0].message}`;
  return `Validation failed for ${errors.length} fields`;
};

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
        const formattedErrors = error.issues.map(formatZodIssue);

        return res.status(400).json({
          status: 'FAILED',
          success: false,
          message: 'Validation failed',
          errorCode: 'VALIDATION_ERROR',
          summary: summarizeValidation(formattedErrors),
          errors: formattedErrors,
          fieldErrors: formattedErrors,
          hint: 'Check the highlighted fields and submit the request again.',
        });
      }

      // Unexpected error
      return res.status(500).json({
        status: 'FAILED',
        success: false,
        message: 'Validation error',
        errorCode: 'VALIDATION_HANDLER_ERROR',
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
      const formattedErrors = error.issues.map(formatZodIssue);

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
        errors: error.issues.map(formatZodIssue),
      };
    }

    return {
      success: false,
      errors: [{ field: 'unknown', message: error.message }],
    };
  }
};
