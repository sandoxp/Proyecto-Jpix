'use strict';
const { verifyAccessToken } = require('../utils/jwt');

exports.auth = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: { message: 'Token requerido', code: 401 }});
    }
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, rol: payload.rol };
    next();
  } catch (err) {
    return res.status(401).json({ error: { message: 'Token inválido o expirado', code: 401 }});
  }
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: { message: 'No autenticado', code: 401 }});
  if (!roles.includes(req.user.rol)) {
    return res.status(403).json({ error: { message: 'No autorizado', code: 403 }});
  }
  next();
};
