// catchAsync.js
// Utility to wrap async route handlers and forward errors to Express error middleware

const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
