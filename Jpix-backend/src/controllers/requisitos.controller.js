'use strict';

// Importamos 'sequelize' para transacciones y 'Op' para búsquedas
const { Requisito, Asignatura, sequelize } = require('../models');
const { ok, fail } = require('../utils/responses');
const { Op } = require('sequelize');

/**
 * Lista requisitos.
 * Si se pasa ?asignatura_sigla=X, filtra por esa sigla.
 * Incluye la información de la asignatura "requerida".
 */
exports.list = async (req, res, next) => {
  try {
    const whereClause = {};

    // Filtro para el admin (ej. en la página de detalle de una asignatura)
    if (req.query.asignatura_sigla) {
      // 1. Encontrar la Asignatura por sigla para obtener su ID
      const asignatura = await Asignatura.findOne({ 
        where: { sigla: req.query.asignatura_sigla.toUpperCase() },
        attributes: ['id']
      });

      if (!asignatura) {
        return ok(res, []); // Si la asignatura no existe, no tiene requisitos
      }
      whereClause.asignatura_id = asignatura.id;
    }

    const data = await Requisito.findAll({
      where: whereClause,
      // Incluimos la info de la asignatura que ES el requisito
      include: [
        { model: Asignatura, as: 'requerida' } // <-- gracias al 'as' del modelo
      ]
    });
    return ok(res, data);

  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un requisito por su ID de fila.
 */
exports.getOne = async (req, res) => {
  const data = await Requisito.findOne({
    where: { id: req.params.id },
    include: [
      { model: Asignatura, as: 'asignatura' },
      { model: Asignatura, as: 'requerida' }
    ]
  });
  return data ? ok(res, data) : fail(res, 'Requisito no encontrado', 404);
};

// ===============================================
// --- INICIO: NUEVAS FUNCIONES CRUD (EF 1) ---
// ===============================================

/**
 * Crea una nueva relación de requisito.
 * Espera un body como:
 * {
 * "asignatura_sigla": "INF101",
 * "requiere_sigla": "MAT100"
 * }
 */
exports.create = async (req, res, next) => {
  const { asignatura_sigla, requiere_sigla } = req.body;

  if (!asignatura_sigla || !requiere_sigla) {
    return fail(res, 'Faltan las siglas de asignatura y/o requisito.', 400);
  }

  const t = await sequelize.transaction();
  try {
    // 1. Buscar ambas asignaturas por sus siglas
    const [asignatura, requerida] = await Promise.all([
      Asignatura.findOne({ where: { sigla: asignatura_sigla.toUpperCase() }, transaction: t }),
      Asignatura.findOne({ where: { sigla: requiere_sigla.toUpperCase() }, transaction: t })
    ]);

    // 2. Validar que existan
    if (!asignatura) return fail(res, `Asignatura ${asignatura_sigla} no encontrada.`, 404);
    if (!requerida) return fail(res, `Asignatura requisito ${requiere_sigla} no encontrada.`, 404);

    // 3. Crear la relación
    const [nuevoRequisito, fueCreado] = await Requisito.findOrCreate({
      where: {
        asignatura_id: asignatura.id,
        requiere_id: requerida.id
      },
      transaction: t
    });

    if (!fueCreado) {
      await t.rollback();
      return fail(res, 'Este requisito ya existe para esta asignatura.', 409); // 409 Conflict
    }

    // 4. Confirmar transacción
    await t.commit();

    // Recargamos para devolverlo con la info de la asignatura 'requerida'
    const requisitoCompleto = await Requisito.findByPk(nuevoRequisito.id, {
      include: [{ model: Asignatura, as: 'requerida' }]
    });

    return ok(res, requisitoCompleto, 201); // 201 Created

  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Elimina una relación de requisito por su ID (el ID de la fila en la tabla 'requisitos').
 */
exports.remove = async (req, res, next) => {
  const requisitoId = req.params.id;
  try {
    const requisito = await Requisito.findByPk(requisitoId);
    if (!requisito) {
      return fail(res, 'Requisito no encontrado', 404);
    }

    await requisito.destroy();
    
    return ok(res, { message: 'Requisito eliminado correctamente' });

  } catch (error) {
    next(error);
  }
};