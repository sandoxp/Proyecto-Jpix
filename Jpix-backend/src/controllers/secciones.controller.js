'use strict';

// Importamos 'sequelize' para las transacciones
const { Seccion, BloqueHorario, sequelize } = require('../models');
const { ok, fail } = require('../utils/responses');

/**
 * --- ¡AQUÍ ESTÁ EL ARREGLO! ---
 * Lista secciones.
 * Si se pasa ?asignatura_id=X, filtra por esa asignatura.
 * Si no, lista todas.
 */
exports.list = async (req, res) => {
  // 1. Preparamos un objeto 'where' vacío
  const whereClause = {};
  
  // 2. Revisamos si el frontend nos envió un query param 'asignatura_id'
  if (req.query.asignatura_id) {
    // 3. Si lo envió, lo añadimos al 'where'
    whereClause.asignatura_id = req.query.asignatura_id;
  }

  const data = await Seccion.findAll({
    where: whereClause, // <-- 4. Aplicamos el filtro (estará vacío o tendrá el ID)
    include: [{ model: BloqueHorario, as: 'bloques' }],
    order: [['seccion', 'ASC']]
  });
  return ok(res, data);
};

/**
 * Obtiene una sección por su ID.
 */
exports.getOne = async (req, res) => {
  const data = await Seccion.findOne({
    where: { id: req.params.id },
    include: [{ model: BloqueHorario, as: 'bloques' }]
  });
  return data ? ok(res, data) : fail(res, 'Sección no encontrada', 404);
};

// ===============================================
// --- FUNCIONES CRUD (que ya escribimos) ---
// ===============================================

/**
 * Crea una sección y sus bloques asociados en una transacción.
 */
exports.create = async (req, res, next) => {
  const t = await sequelize.transaction(); // Iniciar transacción
  try {
    const { bloques, ...seccionData } = req.body;

    const nuevaSeccion = await Seccion.create(seccionData, { transaction: t });

    if (bloques && bloques.length > 0) {
      const bloquesData = bloques.map(b => ({
        ...b,
        seccion_id: nuevaSeccion.id
      }));
      await BloqueHorario.bulkCreate(bloquesData, { transaction: t });
    }

    await t.commit();

    const seccionCompleta = await Seccion.findByPk(nuevaSeccion.id, {
      include: [{ model: BloqueHorario, as: 'bloques' }]
    });

    return ok(res, seccionCompleta, 201);

  } catch (error) {
    await t.rollback(); 
    next(error);
  }
};

/**
 * Actualiza una sección y sus bloques en una transacción.
 */
exports.update = async (req, res, next) => {
  const seccionId = req.params.id;
  const t = await sequelize.transaction();
  try {
    const { bloques, ...seccionData } = req.body;

    const seccion = await Seccion.findByPk(seccionId);
    if (!seccion) {
      await t.rollback();
      return fail(res, 'Sección no encontrada', 404);
    }

    await seccion.update(seccionData, { transaction: t });

    await BloqueHorario.destroy({
      where: { seccion_id: seccionId },
      transaction: t
    });

    if (bloques && bloques.length > 0) {
      const bloquesData = bloques.map(b => ({
        ...b,
        seccion_id: seccion.id
      }));
      await BloqueHorario.bulkCreate(bloquesData, { transaction: t });
    }

    await t.commit();
    
    const seccionCompleta = await Seccion.findByPk(seccion.id, {
      include: [{ model: BloqueHorario, as: 'bloques' }]
    });
    
    return ok(res, seccionCompleta);

  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Elimina una sección y sus bloques asociados.
 */
exports.remove = async (req, res, next) => {
  const seccionId = req.params.id;
  const t = await sequelize.transaction();
  try {
    const seccion = await Seccion.findByPk(seccionId);
    if (!seccion) {
      await t.rollback();
      return fail(res, 'Sección no encontrada', 404);
    }

    await BloqueHorario.destroy({
      where: { seccion_id: seccionId },
      transaction: t
    });
    
    await seccion.destroy({ transaction: t });

    await t.commit();
    
    return ok(res, { message: 'Sección eliminada correctamente' });

  } catch (error) {
    await t.rollback();
    next(error);
  }
};