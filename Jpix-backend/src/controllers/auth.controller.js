'use strict';
const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');
const { signAccessToken } = require('../utils/jwt');

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

    const token = signAccessToken({ sub: user.id, email: user.email, rol: user.rol });
    res.status(201).json({
      data: {
        token,
        user: { id: user.id, rut: user.rut, nombre: user.nombre, email: user.email, rol: user.rol }
      }
    });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: { message: 'email y password son obligatorios', code: 400 }});

    const user = await Usuario.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: { message: 'Credenciales inválidas', code: 401 }});

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: { message: 'Credenciales inválidas', code: 401 }});

    const token = signAccessToken({ sub: user.id, email: user.email, rol: user.rol });
    res.json({
      data: {
        token,
        user: { id: user.id, rut: user.rut, nombre: user.nombre, email: user.email, rol: user.rol }
      }
    });
  } catch (err) { next(err); }
};

exports.me = async (req, res) => {
  // req.user viene del middleware auth
  res.json({ data: req.user });
};
