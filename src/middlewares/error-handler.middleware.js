export const errorHandler = (err, req, res, next) => {
  // Log error for monitoring
  console.error("Error occurred:", {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    url: req.originalUrl,
    method: req.method,
    details: err.details,
  });

  // Determine status code (default to 500 if not specified)
  const statusCode = err.statusCode || 500;

  // Build response object
  const response = {
    success: false,
    message: err.message || "A system error has occurred.",
    error: {
      code: err.code || "SERVER_ERROR",
      // Include field if exists (for validation errors)
      ...(err.field && { field: err.field }),
      // Include details if exists (for batch operations)
      ...(err.details && { details: err.details }),
    },
  };

  // Send response
  res.status(statusCode).json(response);
};
