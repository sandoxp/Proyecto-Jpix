'use strict';

const { Asignatura, Seccion, BloqueHorario, sequelize, Usuario, ProgresoUsuario } = require('../models');
const { ok, fail } = require('../utils/responses');
const { Op } = require('sequelize');

// ---
// CORRECCIÓN 1: Se añaden 'id', 'tipo', 'periodo_malla'
// Esto arregla el filtro del modal de secciones (Paso 2)
// ---
exports.list = async (_req, res) => {
  const data = await Asignatura.findAll({
    order: [['sigla', 'ASC']],
    attributes: ['id', 'sigla', 'nombre', 'creditos', 'tipo', 'periodo_malla']
  });
  return ok(res, data);
};

exports.getOne = async (req, res) => {
  const sigla = (req.params.sigla || '').toUpperCase();
  const data = await Asignatura.findOne({
    where: { sigla },
    include: [{
      model: Seccion, as: 'secciones',
      include: [{ model: BloqueHorario, as: 'bloques' }]
    }]
  });
  return data ? ok(res, data) : fail(res, 'No encontrada', 404);
};

// ---
// CORRECCIÓN 2: Se añaden 'attributes' al include de BloqueHorario
// Esto arregla el catálogo del estudiante (Paso 4)
// ---
exports.getMiCatalogo = async (req, res, next) => {
  try {
    const usuarioId = req.user.id;

    const todasConProgreso = await Asignatura.findAll({
      include: [
        {
          model: ProgresoUsuario,
          as: 'progreso',
          where: { usuario_id: usuarioId },
          required: false, // LEFT JOIN
          attributes: ['estado']
        },
        {
          model: Seccion, 
          as: 'secciones',
          include: [{ 
            model: BloqueHorario, 
            as: 'bloques',
            // --- ¡ESTA ES LA CORRECCIÓN QUE FALTABA! ---
            attributes: [
              'dia', 
              'clave_ini', // <-- Añadido
              'clave_fin', // <-- Añadido
              'hora_inicio', 
              'hora_fin', 
              'sede', 
              'sala'
            ]
          }]
        }
      ],
    });

    const catalogoFiltrado = todasConProgreso
      .map(a => {
        const asignaturaObj = a.get({ plain: true });
        let estadoFinal = 'pendiente'; // Default
        if (asignaturaObj.progreso && asignaturaObj.progreso.length > 0) {
          estadoFinal = asignaturaObj.progreso[0].estado === 'cursando' ? 'pendiente' : asignaturaObj.progreso[0].estado;
        }
        asignaturaObj.estado = estadoFinal;
        delete asignaturaObj.progreso; // Limpiamos
        return asignaturaObj;
      })
      .filter(a => 
          a.estado === 'pendiente' || a.estado === 'reprobada' || a.tipo === 'fofu'
      );

    catalogoFiltrado.sort((a, b) => {
      if (a.estado === 'reprobada' && b.estado !== 'reprobada') return -1;
      if (a.estado !== 'reprobada' && b.estado === 'reprobada') return 1;
      const semestreA = a.periodo_malla ?? Infinity;
      const semestreB = b.periodo_malla ?? Infinity;
      if (semestreA !== semestreB) {
        return semestreA - semestreB;
      }
      return a.sigla.localeCompare(b.sigla);
    });

    return ok(res, catalogoFiltrado);

  } catch (err) {
    next(err);
  }
};
// --- FIN DE LA FUNCIÓN MODIFICADA ---


// ===============================================
// --- INICIO: NUEVAS FUNCIONES CRUD (EF 1) ---
// ===============================================

/**
 * @api {post} /api/v1/asignaturas/
 * @description Crear una nueva asignatura.
 * @access Admin
 */
exports.create = async (req, res, next) => {
  try {
    const nuevaAsignatura = req.body;
    if (nuevaAsignatura.sigla) {
      nuevaAsignatura.sigla = nuevaAsignatura.sigla.toUpperCase();
    }
    const asignatura = await Asignatura.create(nuevaAsignatura);
    return ok(res, asignatura, 201); 
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return fail(res, `La sigla '${req.body.sigla}' ya existe.`, 409); // 409 Conflict
    }
    if (error.name === 'SequelizeValidationError') {
      return fail(res, error.message, 400); // 400 Bad Request
    }
    next(error);
  }
};

/**
 * @api {put} /api/v1/asignaturas/:sigla
 * @description Actualizar una asignatura existente.
 * @access Admin
 */
exports.update = async (req, res) => {
  const sigla = (req.params.sigla || '').toUpperCase();
  const datosUpdate = req.body;
  const asignatura = await Asignatura.findOne({ where: { sigla } });
  if (!asignatura) {
    return fail(res, 'Asignatura no encontrada', 404);
  }
  await asignatura.update(datosUpdate);
  return ok(res, asignatura);
};

/**
 * @api {delete} /api/v1/asignaturas/:sigla
 * @description Eliminar una asignatura.
 * @access Admin
 */
exports.remove = async (req, res) => {
  const sigla = (req.params.sigla || '').toUpperCase();
  const asignatura = await Asignatura.findOne({ where: { sigla } });
  if (!asignatura) {
    return fail(res, 'Asignatura no encontrada', 404);
  }
  await asignatura.destroy();
  return ok(res, { message: 'Asignatura eliminada correctamente' });
};