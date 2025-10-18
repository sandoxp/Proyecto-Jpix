// Respuestas uniformes para el front
exports.ok = (res, data, status = 200) => {
  if (status === 204) return res.status(204).end();
  return res.status(status).json({ data });
};

exports.fail = (res, message, code = 400, meta) => {
  const payload = { error: { message, code } };
  if (meta) payload.error.meta = meta;
  return res.status(code).json(payload);
};
