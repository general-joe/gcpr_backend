// catchAsync.js
// Utility to wrap async route handlers and forward errors to Express error middleware

const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Log the error with context
      const errorContext = {
        method: req.method,
        path: req.path,
        userId: res.locals?.user?.id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
        errorMessage: error.message,
        errorStack: error.stack,
        statusCode: error.status || 500,
      };
      
      WRITE.error(
        `Async Error in ${req.method} ${req.path}`,
        errorContext
      );
      
      next(error);
    });
  };
};

export default catchAsync;
