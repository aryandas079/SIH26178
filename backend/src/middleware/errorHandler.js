/** JSON error response middleware. */

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: 'ENDPOINT_NOT_FOUND',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
}

export function globalErrorHandler(err, req, res, next) {
  console.error('[API Error]:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.name || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected internal server error occurred.',
    timestamp: new Date().toISOString(),
  });
}
