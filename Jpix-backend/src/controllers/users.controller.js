// src/controllers/users.controller.js
'use strict';

const { Op } = require('sequelize');
const { Usuario, RefreshToken, Asignatura, ProgresoUsuario } = require('../models'); 
const bcrypt = require('bcryptjs');
const { ok, fail } = require('../utils/responses');

// ============== Admin ==============

// ... (las funciones list, getOne, create, update, remove no cambian para esta tarea) ...
exports.list = async (_req, res, next) => {
  try {
    const data = await Usuario.findAll({
      // --- MODIFICADO: Añadimos 'ira' a la lista ---
      attributes: ['id','rut','nombre','email','rol','carrera','periodo_malla','ira','createdAt','updatedAt'], 
      order: [['id','ASC']]
    });
    return ok(res, data);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.params.id, {
      // --- MODIFICADO: Añadimos 'ira' a la lista ---
      attributes: ['id','rut','nombre','email','rol','carrera','periodo_malla','ira','createdAt','updatedAt']
    });
    return user ? ok(res, user) : fail(res, 'Usuario no encontrado', 404);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    // --- MODIFICADO: Añadimos 'ira' ---
    const { rut, nombre, email, password, rol = 'estudiante', carrera, periodo_malla, ira } = req.body;
    
    if (!rut || !nombre || !email || !password) {
      return fail(res, 'rut, nombre, email y password son obligatorios', 400);
    }
    // --- MODIFICADO: Validación extra (ira) ---
    if (rol === 'estudiante' && (!carrera || periodo_malla === undefined || !ira)) {
       return fail(res, 'carrera, periodo_malla e ira son obligatorios para estudiantes', 400);
    }
    // --- AÑADIDO: Validación de valor de IRA ---
    if (ira && !['bajo', 'medio', 'alto'].includes(ira)) {
      return fail(res, "El campo 'ira' debe ser 'bajo', 'medio' o 'alto'", 400);
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await Usuario.create({ 
      rut, 
      nombre, 
      email, 
      password_hash, 
      rol,
      carrera: rol === 'estudiante' ? carrera : null,
      periodo_malla: rol === 'estudiante' ? parseInt(periodo_malla, 10) || null : null,
      ira: rol === 'estudiante' ? ira : 'bajo' // --- AÑADIDO ---
    });

    // --- Lógica de autocompletar (sin cambios) ---
    if (user.rol === 'estudiante' && user.periodo_malla && user.periodo_malla > 1) {
      try {
        const asignaturasAnteriores = await Asignatura.findAll({
          where: {
            periodo_malla: { [Op.lt]: user.periodo_malla },
            tipo: 'obligatoria'
          },
          attributes: ['sigla'] 
        });
        const progresosParaCrear = asignaturasAnteriores.map(asig => ({
          usuario_id: user.id,
          asignatura_sigla: asig.sigla,
          estado: 'aprobada' 
        }));
        if (progresosParaCrear.length > 0) {
          await ProgresoUsuario.bulkCreate(progresosParaCrear, {
            ignoreDuplicates: true 
          });
        }
      } catch (fillError) {
        console.error('Error al autocompletar el progreso durante la creación (admin):', fillError);
      }
    }
    // --- FIN LÓGICA AUTOCOMPLETAR ---

    // --- MODIFICADO: Devolvemos 'ira' ---
    return ok(res, { id: user.id, rut: user.rut, nombre: user.nombre, email: user.email, rol: user.rol, carrera: user.carrera, periodo_malla: user.periodo_malla, ira: user.ira }, 201);
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

    // --- MODIFICADO: Añadimos 'ira' ---
    const { rut, nombre, email, password, rol, carrera, periodo_malla, ira } = req.body;

    const oldEmail = user.email;
    const oldRol = user.rol;
    const oldPeriodoMalla = user.periodo_malla; 
    const oldIra = user.ira; // --- AÑADIDO ---

    if (rut !== undefined)      user.rut = rut;
    if (nombre !== undefined)   user.nombre = nombre;
    if (email !== undefined)    user.email = email;
    if (rol !== undefined)      user.rol = rol;
    if (carrera !== undefined)  user.carrera = carrera;
    if (periodo_malla !== undefined) user.periodo_malla = parseInt(periodo_malla, 10) || null;
    
    // --- AÑADIDO: Actualización de IRA (con validación) ---
    if (ira !== undefined) {
      if (!['bajo', 'medio', 'alto'].includes(ira)) {
        return fail(res, "El campo 'ira' debe ser 'bajo', 'medio' o 'alto'", 400);
      }
      user.ira = ira;
    }

    if (password)               user.password_hash = await bcrypt.hash(password, 10);

    await user.save();

    // --- Lógica de autocompletar (sin cambios) ---
    const nuevoPeriodo = user.periodo_malla;
    if (user.rol === 'estudiante' && 
        periodo_malla !== undefined && 
        nuevoPeriodo > (oldPeriodoMalla || 0)) {
      try {
        const asignaturasIntermedias = await Asignatura.findAll({
          where: {
            periodo_malla: {
              [Op.gte]: oldPeriodoMalla || 1, 
              [Op.lt]: nuevoPeriodo
            },
            tipo: 'obligatoria'
          },
          attributes: ['sigla']
        });
        const progresosParaCrear = asignaturasIntermedias.map(asig => ({
          usuario_id: user.id,
          asignatura_sigla: asig.sigla,
          estado: 'aprobada'
        }));
        if (progresosParaCrear.length > 0) {
          await ProgresoUsuario.bulkCreate(progresosParaCrear, {
            ignoreDuplicates: true
          });
        }
      } catch (fillError) {
        console.error('Error al autocompletar el progreso durante la actualización (admin):', fillError);
      }
    }
    // --- FIN LÓGICA AUTOCOMPLETAR ---

    // --- MODIFICADO: Revocar tokens si cambia email, rol O IRA ---
    if ((email !== undefined && email !== oldEmail) || 
        (rol !== undefined && rol !== oldRol) ||
        (ira !== undefined && ira !== oldIra)) {
      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { user_id: user.id, revoked_at: null } }
      );
    }
    // --- MODIFICADO: Devolvemos 'ira' ---
    return ok(res, { id: user.id, rut: user.rut, nombre: user.nombre, email: user.email, rol: user.rol, carrera: user.carrera, periodo_malla: user.periodo_malla, ira: user.ira });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return fail(res, 'Email o RUT ya existe', 409);
    }
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  // ... (sin cambios) ...
  try {
    const n = await Usuario.destroy({ where: { id: req.params.id } });
    return n ? ok(res, null, 204) : fail(res, 'Usuario no encontrado', 404);
  } catch (err) { next(err); }
};

// ============== Self (usuario autenticado) ==============

exports.me = async (req, res, next) => {
  try {
    // --- MODIFICADO: Añadimos 'ira' ---
    const user = await Usuario.findByPk(req.user.id, {
      attributes: ['id','rut','nombre','email','rol','carrera','periodo_malla','ira','createdAt','updatedAt']
    });
    return user ? ok(res, user) : fail(res, 'Usuario no encontrado', 404);
  } catch (err) { next(err); }
};

// ==================================================================
// ================== FUNCIÓN MODIFICADA (updateSelf) ===============
// ==================================================================
exports.updateSelf = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.user.id);
    if (!user) return fail(res, 'Usuario no encontrado', 404);

    // --- MODIFICADO: Añadimos 'ira' ---
    const { nombre, email, password, carrera, periodo_malla, ira } = req.body;
    const oldEmail = user.email;
    const oldPeriodoMalla = user.periodo_malla;
    const oldIra = user.ira; // --- AÑADIDO ---

    if (nombre !== undefined)   user.nombre = nombre;
    if (email !== undefined)    user.email  = email;
    if (carrera !== undefined)  user.carrera = carrera;
    if (periodo_malla !== undefined) user.periodo_malla = parseInt(periodo_malla, 10) || null;
    
    // --- AÑADIDO: Actualización de IRA (con validación) ---
    if (ira !== undefined) {
      if (!['bajo', 'medio', 'alto'].includes(ira)) {
        return fail(res, "El campo 'ira' debe ser 'bajo', 'medio' o 'alto'", 400);
      }
      user.ira = ira;
    }

    if (password)               user.password_hash = await bcrypt.hash(password, 10);

    await user.save();

    // --- Lógica de autocompletar (sin cambios) ---
    const nuevoPeriodo = user.periodo_malla;
    if (user.rol === 'estudiante' && 
        periodo_malla !== undefined && 
        nuevoPeriodo > (oldPeriodoMalla || 0)) { 
      try {
        const asignaturasIntermedias = await Asignatura.findAll({
          where: {
            periodo_malla: {
              [Op.gte]: oldPeriodoMalla || 1, 
              [Op.lt]: nuevoPeriodo
            },
            tipo: 'obligatoria'
          },
          attributes: ['sigla']
        });
        
        const progresosParaCrear = asignaturasIntermedias.map(asig => ({
          usuario_id: user.id,
          asignatura_sigla: asig.sigla,
          estado: 'aprobada'
        }));

        if (progresosParaCrear.length > 0) {
          await ProgresoUsuario.bulkCreate(progresosParaCrear, {
            ignoreDuplicates: true
          });
        }
      } catch (fillError) {
        console.error('Error al autocompletar el progreso durante la actualización del perfil:', fillError);
      }
    }
    // --- FIN LÓGICA AUTOCOMPLETAR ---

    // --- MODIFICADO: Revocar tokens si cambia email O IRA ---
    if ((email !== undefined && email !== oldEmail) || (ira !== undefined && ira !== oldIra)) {
      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { user_id: user.id, revoked_at: null } }
      );
    }
    
    // --- MODIFICADO: Devolvemos 'ira' ---
    return ok(res, { 
      user: {
        id: user.id, 
        rut: user.rut, 
        nombre: user.nombre, 
        email: user.email, 
        rol: user.rol, 
        carrera: user.carrera, 
        periodo_malla: user.periodo_malla,
        ira: user.ira // <-- AÑADIDO
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
// ================== FIN DE LA MODIFICACIÓN ========================
// ==================================================================