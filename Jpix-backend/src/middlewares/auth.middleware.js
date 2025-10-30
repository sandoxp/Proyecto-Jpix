'use strict';
const { verifyAccessToken } = require('../utils/jwt');

/**
 * Verifica JWT y adjunta req.user = { id, email, rol, ira }
 */
exports.auth = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: { message: 'Token requerido', code: 401 }});
    }
    const payload = verifyAccessToken(token);

    // --- MODIFICACIÓN AQUÍ ---
    // Añadimos 'ira' al objeto req.user para que esté disponible en todos los controladores
    req.user = { id: payload.sub, email: payload.email, rol: payload.rol, ira: payload.ira };
    // --- FIN DE LA MODIFICACIÓN ---

    next();
  } catch (err) {
    return res.status(401).json({ error: { message: 'Token inválido o expirado', code: 401 }});
  }
};

/**
 * Permite sólo si el rol del usuario está en la lista
 * Ej: requireRole('admin') o requireRole('admin','estudiante')
 */
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: { message: 'No autenticado', code: 401 }});
  if (!roles.includes(req.user.rol)) {
    return res.status(403).json({ error: { message: 'No autorizado', code: 403 }});
  }
  next();
};

/**
 * Permite si es admin o si el :id coincide con el usuario autenticado
 * Útil en rutas tipo PUT /usuarios/:id
 */
exports.requireSelfOrAdmin = (paramName = 'id') => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: { message: 'No autenticado', code: 401 }});
  const isAdmin = req.user.rol === 'admin';
  const isSelf = String(req.user.id) === String(req.params[paramName]);
  if (!isAdmin && !isSelf) {
    return res.status(403).json({ error: { message: 'No autorizado', code: 403 }});
  }
  next();
};