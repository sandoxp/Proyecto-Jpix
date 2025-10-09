exports.errorHandler = (err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: { message: err.message || 'Error interno', code: status }});
};
