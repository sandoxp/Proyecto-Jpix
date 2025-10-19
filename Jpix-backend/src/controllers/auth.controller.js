'use strict';

const bcrypt = require('bcryptjs');
const { Usuario, RefreshToken } = require('../models');
const { signAccessToken } = require('../utils/jwt');
const { randomToken, hashToken, addDays } = require('../utils/tokens');

const REFRESH_DAYS = parseInt(process.env.REFRESH_DAYS || '7', 10);

// Genera par (access + refresh) y guarda refresh en BD (hash)
async function issuePair(user) {
  const token = signAccessToken({ sub: user.id, email: user.email, rol: user.rol });
  const rawRefresh = randomToken(64);
  const token_hash = hashToken(rawRefresh);

  await RefreshToken.create({
    token_hash,
    user_id: user.id,
    expires_at: addDays(new Date(), REFRESH_DAYS)
  });

  return { token, refreshToken: rawRefresh };
}

exports.register = async (req, res, next) => {
  try {
    const { rut, nombre, email, password, rol = 'estudiante' } = req.body;
    if (!rut || !nombre || !email || !password) {
      return res.status(400).json({ error: { message: 'rut, nombre, email y password son obligatorios', code: 400 }});
    }
    const exists = await Usuario.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: { message: 'Email ya existe', code: 409 }});

    const password_hash = await bcrypt.hash(password, 10);
    const user = await Usuario.create({ rut, nombre, email, password_hash, rol });

    const pair = await issuePair(user);
    res.status(201).json({
      data: {
        token: pair.token,
        refreshToken: pair.refreshToken,
        user: { id: user.id, rut: user.rut, nombre: user.nombre, email: user.email, rol: user.rol }
      }
    });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, rut, password } = req.body; // acepta email o rut
    if ((!email && !rut) || !password) {
      return res.status(400).json({ error: { message: 'email o rut + password son obligatorios', code: 400 }});
    }

    const where = email ? { email } : { rut };
    const user = await Usuario.findOne({ where });
    if (!user) return res.status(401).json({ error: { message: 'Credenciales inválidas', code: 401 }});

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: { message: 'Credenciales inválidas', code: 401 }});

    const pair = await issuePair(user);
    res.json({
      data: {
        token: pair.token,
        refreshToken: pair.refreshToken,
        user: { id: user.id, rut: user.rut, nombre: user.nombre, email: user.email, rol: user.rol }
      }
    });
  } catch (err) { next(err); }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: { message: 'refreshToken requerido', code: 400 }});

    const token_hash = hashToken(refreshToken);
    const row = await RefreshToken.findOne({ where: { token_hash } });
    if (!row || row.revoked_at || row.expires_at < new Date()) {
      return res.status(401).json({ error: { message: 'Refresh inválido', code: 401 }});
    }

    // rotación: invalida el viejo y crea uno nuevo
    const user = await Usuario.findByPk(row.user_id);
    const { token, refreshToken: newRaw } = await (async () => {
      const access = signAccessToken({ sub: user.id, email: user.email, rol: user.rol });
      const raw = randomToken(64);
      const h = hashToken(raw);
      await row.update({ revoked_at: new Date(), replaced_by_hash: h });
      await RefreshToken.create({ token_hash: h, user_id: user.id, expires_at: addDays(new Date(), REFRESH_DAYS) });
      return { token: access, refreshToken: raw };
    })();

    res.json({ data: { token, refreshToken: newRaw }});
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: { message: 'refreshToken requerido', code: 400 }});

    const token_hash = hashToken(refreshToken);
    const row = await RefreshToken.findOne({ where: { token_hash } });
    if (row && !row.revoked_at) await row.update({ revoked_at: new Date() });
    res.status(204).end();
  } catch (err) { next(err); }
};

exports.me = async (req, res) => {
  res.json({ data: req.user });
};
