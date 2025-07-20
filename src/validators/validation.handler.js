//validators/validation.handler.js

import { validationResult } from "express-validator";

/**
 * Universal validation error handler
 * Use this middleware after validation rules in all routes
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  // If no errors, continue to next middleware/controller
  if (errors.isEmpty()) {
    return next();
  }

  // Extract and format errors
  const extractedErrors = errors.array();

  // Group errors by field for better UX
  const errorsByField = {};
  extractedErrors.forEach((error) => {
    const field = error.path || error.param;
    if (!errorsByField[field]) {
      errorsByField[field] = [];
    }
    errorsByField[field].push(error.msg);
  });

  // Get first error message for display
  const firstError = extractedErrors[0]?.msg || "Validation failed";

  // Return standardized error response
  return res.status(400).json({
    success: false,
    message: firstError,
    errors: {
      details: extractedErrors,
      byField: errorsByField,
      count: extractedErrors.length,
    },
  });
};
