// src/controllers/users.controller.js
'use strict';

// --- AÑADIDO: Importar Op y los modelos necesarios ---
const { Op } = require('sequelize');
const { Usuario, RefreshToken, Asignatura, ProgresoUsuario } = require('../models'); 
// --- FIN DE LO AÑADIDO ---
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
      periodo_malla: rol === 'estudiante' ? parseInt(periodo_malla, 10) || null : null
    });

    // --- ¡¡LÓGICA DE AUTOCOMPLETAR (copiada de auth.controller)!! ---
    if (user.rol === 'estudiante' && user.periodo_malla && user.periodo_malla > 1) {
      try {
        // 1. Buscar asignaturas obligatorias de semestres anteriores
        const asignaturasAnteriores = await Asignatura.findAll({
          where: {
            periodo_malla: { [Op.lt]: user.periodo_malla },
            tipo: 'obligatoria' // Corregido
          },
          attributes: ['sigla'] 
        });
        // 2. Preparar los datos para la inserción masiva
        const progresosParaCrear = asignaturasAnteriores.map(asig => ({
          usuario_id: user.id,
          asignatura_sigla: asig.sigla,
          estado: 'aprobada' 
        }));
        // 3. Insertar todos los registros de progreso de una vez
        if (progresosParaCrear.length > 0) {
          await ProgresoUsuario.bulkCreate(progresosParaCrear, {
            ignoreDuplicates: true 
          });
        }
      } catch (fillError) {
        console.error('Error al autocompletar el progreso durante la creación (admin):', fillError);
      }
    }
    // --- FIN DE LA LÓGICA DE AUTOCOMPLETAR ---

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
    // --- AÑADIDO: Guardar el periodo_malla anterior ---
    const oldPeriodoMalla = user.periodo_malla; 

    if (rut !== undefined)      user.rut = rut;
    if (nombre !== undefined)   user.nombre = nombre;
    if (email !== undefined)    user.email = email;
    if (rol !== undefined)      user.rol = rol;
    // Incluye nuevos campos en la actualización
    if (carrera !== undefined)  user.carrera = carrera;
    // --- MODIFICADO: Asegurarse de convertir a número ---
    if (periodo_malla !== undefined) user.periodo_malla = parseInt(periodo_malla, 10) || null;
    
    if (password)               user.password_hash = await bcrypt.hash(password, 10);

    await user.save(); // user.periodo_malla AHORA es el nuevo valor

    // --- ¡¡NUEVA LÓGICA DE AUTOCOMPLETAR AL ACTUALIZAR!! ---
    // Solo si es estudiante, el periodo_malla cambió y es mayor que el anterior
    const nuevoPeriodo = user.periodo_malla;
    if (user.rol === 'estudiante' && 
        periodo_malla !== undefined && // <-- el periodo_malla del req.body
        nuevoPeriodo > (oldPeriodoMalla || 0)) { // Compara nuevo (4) > anterior (2 o null->0)
      try {
        // 1. Buscar asignaturas obligatorias entre el semestre anterior y el nuevo
        const asignaturasIntermedias = await Asignatura.findAll({
          where: {
            periodo_malla: {
              [Op.gte]: oldPeriodoMalla || 1, // <-- ARREGLO: Si era null, parte desde 1
              [Op.lt]: nuevoPeriodo           // Menor que el nuevo
            },
            tipo: 'obligatoria' // Corregido
          },
          attributes: ['sigla']
        });
        // 2. Preparar los datos
        const progresosParaCrear = asignaturasIntermedias.map(asig => ({
          usuario_id: user.id,
          asignatura_sigla: asig.sigla,
          estado: 'aprobada'
        }));
        // 3. Insertar (ignorando duplicados por si ya estaban marcadas)
        if (progresosParaCrear.length > 0) {
          await ProgresoUsuario.bulkCreate(progresosParaCrear, {
            ignoreDuplicates: true // No sobrescribe si ya estaba 'reprobada'
          });
        }
      } catch (fillError) {
        console.error('Error al autocompletar el progreso durante la actualización (admin):', fillError);
      }
    }
    // --- FIN DE LA LÓGICA DE AUTOCOMPLETAR ---

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

    const { nombre, email, password, carrera, periodo_malla } = req.body;
    const oldEmail = user.email;
    // --- AÑADIDO: Guardar el periodo_malla anterior ---
    const oldPeriodoMalla = user.periodo_malla; // Podría ser 2, o null

    // aquí NO se permite tocar rol ni rut
    if (nombre !== undefined)   user.nombre = nombre;
    if (email !== undefined)    user.email  = email;
    if (carrera !== undefined)  user.carrera = carrera;
    // --- MODIFICADO: Asegurarse de convertir a número ---
    if (periodo_malla !== undefined) user.periodo_malla = parseInt(periodo_malla, 10) || null;
    
    if (password)               user.password_hash = await bcrypt.hash(password, 10);

    await user.save(); // user.periodo_malla AHORA es el nuevo valor (ej: 4)

    // --- ¡¡NUEVA LÓGICA DE AUTOCOMPLETAR AL ACTUALIZAR PERFIL!! ---
    // Solo si es estudiante, el periodo_malla cambió y es mayor que el anterior
    const nuevoPeriodo = user.periodo_malla;
    if (user.rol === 'estudiante' && 
        periodo_malla !== undefined && // <-- el periodo_malla del req.body
        nuevoPeriodo > (oldPeriodoMalla || 0)) { // Compara nuevo (4) > anterior (null->0)
      try {
        // 1. Buscar asignaturas obligatorias entre el semestre anterior y el nuevo
        const asignaturasIntermedias = await Asignatura.findAll({
          where: {
            periodo_malla: {
              [Op.gte]: oldPeriodoMalla || 1, // <-- ARREGLO: Si era null, parte desde 1
              [Op.lt]: nuevoPeriodo           // Menor que el nuevo (ej: < 4)
            },
            // --- CORRECCIÓN AQUÍ ---
            tipo: 'obligatoria' // Debe ser 'obligatoria' (singular)
            // --- FIN CORRECCIÓN ---
          },
          attributes: ['sigla']
        });
        
        // 2. Preparar los datos
        const progresosParaCrear = asignaturasIntermedias.map(asig => ({
          usuario_id: user.id,
          asignatura_sigla: asig.sigla,
          estado: 'aprobada'
        }));

        // 3. Insertar (ignorando duplicados por si ya estaban marcadas)
        if (progresosParaCrear.length > 0) {
          await ProgresoUsuario.bulkCreate(progresosParaCrear, {
            ignoreDuplicates: true // No sobrescribe si ya estaba 'reprobada'
          });
        }
      } catch (fillError) {
        console.error('Error al autocompletar el progreso durante la actualización del perfil:', fillError);
      }
    }
    // --- FIN DE LA LÓGICA DE AUTOCOMPLETAR ---

    if (email !== undefined && email !== oldEmail) {
      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { user_id: user.id, revoked_at: null } }
      );
    }
    
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