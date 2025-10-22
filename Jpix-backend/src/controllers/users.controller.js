// src/controllers/users.controller.js
'use strict';

const { Usuario, RefreshToken } = require('../models');
const bcrypt = require('bcryptjs');
const { ok, fail } = require('../utils/responses');

// ============== Admin ==============

exports.list = async (_req, res, next) => {
  try {
    const data = await Usuario.findAll({
      attributes: ['id','rut','nombre','email','rol','carrera','periodo_malla','createdAt','updatedAt'], // Incluye nuevos campos
      order: [['id','ASC']]
    });
    return ok(res, data);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.params.id, {
      attributes: ['id','rut','nombre','email','rol','carrera','periodo_malla','createdAt','updatedAt'] // Incluye nuevos campos
    });
    return user ? ok(res, user) : fail(res, 'Usuario no encontrado', 404);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    // Incluye nuevos campos aquí también por consistencia
    const { rut, nombre, email, password, rol = 'estudiante', carrera, periodo_malla } = req.body;
    
    if (!rut || !nombre || !email || !password) {
      return fail(res, 'rut, nombre, email y password son obligatorios', 400);
    }
    // Validación extra si es estudiante
    if (rol === 'estudiante' && (!carrera || periodo_malla === undefined)) {
       return fail(res, 'carrera y periodo_malla son obligatorios para estudiantes', 400);
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await Usuario.create({ 
      rut, 
      nombre, 
      email, 
      password_hash, 
      rol,
      carrera: rol === 'estudiante' ? carrera : null,
      periodo_malla: rol === 'estudiante' ? periodo_malla : null
    });
    // Devuelve los nuevos campos
    return ok(res, { id: user.id, rut: user.rut, nombre: user.nombre, email: user.email, rol: user.rol, carrera: user.carrera, periodo_malla: user.periodo_malla }, 201);
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return fail(res, 'Email o RUT ya existe', 409);
    }
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.params.id);
    if (!user) return fail(res, 'Usuario no encontrado', 404);

    // Incluye nuevos campos aquí
    const { rut, nombre, email, password, rol, carrera, periodo_malla } = req.body;

    const oldEmail = user.email;
    const oldRol = user.rol;

    if (rut !== undefined)      user.rut = rut;
    if (nombre !== undefined)   user.nombre = nombre;
    if (email !== undefined)    user.email = email;
    if (rol !== undefined)      user.rol = rol;
    // Incluye nuevos campos en la actualización
    if (carrera !== undefined)  user.carrera = carrera;
    if (periodo_malla !== undefined) user.periodo_malla = periodo_malla;
    
    if (password)               user.password_hash = await bcrypt.hash(password, 10);

    await user.save();

    if ((email !== undefined && email !== oldEmail) || (rol !== undefined && rol !== oldRol)) {
      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { user_id: user.id, revoked_at: null } }
      );
    }
    // Devuelve los nuevos campos
    return ok(res, { id: user.id, rut: user.rut, nombre: user.nombre, email: user.email, rol: user.rol, carrera: user.carrera, periodo_malla: user.periodo_malla });
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
      // Incluye nuevos campos
      attributes: ['id','rut','nombre','email','rol','carrera','periodo_malla','createdAt','updatedAt']
    });
    return user ? ok(res, user) : fail(res, 'Usuario no encontrado', 404);
  } catch (err) { next(err); }
};

// ==================================================================
// ================== FUNCIÓN CORREGIDA (updateSelf) ================
// ==================================================================
exports.updateSelf = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.user.id);
    if (!user) return fail(res, 'Usuario no encontrado', 404);

    // --- 👇 CORRECCIÓN AQUÍ: Extrae los nuevos campos ---
    const { nombre, email, password, carrera, periodo_malla } = req.body;
    const oldEmail = user.email;

    // aquí NO se permite tocar rol ni rut
    if (nombre !== undefined)   user.nombre = nombre;
    if (email !== undefined)    user.email  = email;
    // --- 👇 CORRECCIÓN AQUÍ: Actualiza los nuevos campos ---
    if (carrera !== undefined)  user.carrera = carrera;
    if (periodo_malla !== undefined) user.periodo_malla = periodo_malla;
    
    if (password)               user.password_hash = await bcrypt.hash(password, 10);

    await user.save();

    if (email !== undefined && email !== oldEmail) {
      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { user_id: user.id, revoked_at: null } }
      );
    }
    // --- 👇 CORRECCIÓN AQUÍ: Devuelve los nuevos campos ---
    return ok(res, { 
      user: { // Devuelve dentro de un objeto 'user' como espera el frontend
        id: user.id, 
        rut: user.rut, 
        nombre: user.nombre, 
        email: user.email, 
        rol: user.rol, 
        carrera: user.carrera, 
        periodo_malla: user.periodo_malla 
      }
    });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return fail(res, 'Email ya existe', 409);
    }
    next(err);
  }
};
// ==================================================================
// ================== FIN DE LA CORRECCIÓN ==========================
// ==================================================================