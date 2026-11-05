function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({
    message: err.message || 'Unexpected server error',
    details: err.details || undefined
  });
}

module.exports = errorHandler;
