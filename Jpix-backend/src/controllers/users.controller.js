// src/controllers/users.controller.js
'use strict';

const { Usuario, RefreshToken } = require('../models');
const bcrypt = require('bcryptjs');
const { ok, fail } = require('../utils/responses');

// ============== Admin ==============

exports.list = async (_req, res, next) => {
  try {
    const data = await Usuario.findAll({
      attributes: ['id','rut','nombre','email','rol','createdAt','updatedAt'],
      order: [['id','ASC']]
    });
    return ok(res, data);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.params.id, {
      attributes: ['id','rut','nombre','email','rol','createdAt','updatedAt']
    });
    return user ? ok(res, user) : fail(res, 'Usuario no encontrado', 404);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { rut, nombre, email, password, rol = 'estudiante' } = req.body;
    if (!rut || !nombre || !email || !password) {
      return fail(res, 'rut, nombre, email y password son obligatorios', 400);
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await Usuario.create({ rut, nombre, email, password_hash, rol });
    return ok(res, { id: user.id, rut: user.rut, nombre: user.nombre, email: user.email, rol: user.rol }, 201);
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      // detecta si falló por email/rut
      return fail(res, 'Email o RUT ya existe', 409);
    }
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.params.id);
    if (!user) return fail(res, 'Usuario no encontrado', 404);

    const { rut, nombre, email, password, rol } = req.body;

    // guarda valores previos para decidir revocación de refresh tokens
    const oldEmail = user.email;
    const oldRol = user.rol;

    if (rut !== undefined)    user.rut = rut;
    if (nombre !== undefined) user.nombre = nombre;
    if (email !== undefined)  user.email = email;
    if (rol !== undefined)    user.rol = rol;
    if (password)             user.password_hash = await bcrypt.hash(password, 10);

    await user.save();

    // Si cambió email o rol → revoca refresh tokens activos
    if ((email !== undefined && email !== oldEmail) || (rol !== undefined && rol !== oldRol)) {
      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { user_id: user.id, revoked_at: null } }
      );
    }

    return ok(res, { id: user.id, rut: user.rut, nombre: user.nombre, email: user.email, rol: user.rol });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return fail(res, 'Email o RUT ya existe', 409);
    }
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const n = await Usuario.destroy({ where: { id: req.params.id } });
    return n ? ok(res, null, 204) : fail(res, 'Usuario no encontrado', 404);
  } catch (err) { next(err); }
};

// ============== Self (usuario autenticado) ==============

exports.me = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.user.id, {
      attributes: ['id','rut','nombre','email','rol','createdAt','updatedAt']
    });
    return user ? ok(res, user) : fail(res, 'Usuario no encontrado', 404);
  } catch (err) { next(err); }
};

exports.updateSelf = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.user.id);
    if (!user) return fail(res, 'Usuario no encontrado', 404);

    const { nombre, email, password } = req.body;
    const oldEmail = user.email;

    // aquí NO se permite tocar rol ni rut
    if (nombre !== undefined) user.nombre = nombre;
    if (email !== undefined)  user.email  = email;
    if (password)             user.password_hash = await bcrypt.hash(password, 10);

    await user.save();

    // si cambió email, revoca refresh tokens activos
    if (email !== undefined && email !== oldEmail) {
      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { user_id: user.id, revoked_at: null } }
      );
    }

    return ok(res, { id: user.id, rut: user.rut, nombre: user.nombre, email: user.email, rol: user.rol });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return fail(res, 'Email ya existe', 409);
    }
    next(err);
  }
};
