const { AppError } = require("../utils/AppError");

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err instanceof AppError ? err.statusCode : err.status || 500;
  const message =
    err instanceof AppError
      ? err.message
      : err.message && status !== 500
        ? err.message
        : "Internal server error";

  const body = { error: message };
  if (err instanceof AppError && err.details) {
    body.details = err.details;
  }
  if (process.env.NODE_ENV !== "production" && status === 500 && !(err instanceof AppError)) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
}

module.exports = { errorHandler };
