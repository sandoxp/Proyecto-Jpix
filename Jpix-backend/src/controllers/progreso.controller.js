'use strict';
// Importamos los modelos y utilidades
const { Asignatura, ProgresoUsuario, Usuario } = require('../models');
const { ok, fail } = require('../utils/responses');

// --- MODIFICADO: Eliminamos 'cursando' ---
const ESTADOS_VALIDOS = ['pendiente', 'aprobada', 'reprobada'];

/**
 * GET /progreso
 * Obtiene TODAS las asignaturas y les adjunta el estado de progreso
 * del usuario autenticado (pendiente, aprobada, etc.).
 */
exports.getProgreso = async (req, res, next) => { // <-- Añadido next
  try { // <-- Añadido try
    const usuarioId = req.user.id;

    // 1. Obtener todas las asignaturas, haciendo un LEFT JOIN con
    //    la tabla 'progreso_usuarios' SOLO para el usuario actual.
    const asignaturas = await Asignatura.findAll({
      include: [{
        model: ProgresoUsuario,
        as: 'progreso', // 'as' debe coincidir con la asociación en el modelo Asignatura
        where: { usuario_id: usuarioId },
        required: false, // <-- Esto lo convierte en LEFT JOIN (traer todas las asignaturas)
        attributes: ['estado'] // Solo nos interesa el estado de la tabla progreso
      }],
      order: [
        // Ordenamos por semestre y luego por sigla
        ['periodo_malla', 'ASC'],
        ['sigla', 'ASC']
      ],
    });

    // 2. Mapear los resultados para limpiar la data
    const data = asignaturas.map(a => {
      // Convertimos el modelo de Sequelize a un objeto JSON plano
      const asignaturaObj = a.get({ plain: true });

      // 'progreso' será un array. Si no está vacío, usamos su estado.
      let estadoFinal = 'pendiente'; // Estado por defecto
      if (asignaturaObj.progreso && asignaturaObj.progreso.length > 0) {
        estadoFinal = asignaturaObj.progreso[0].estado;
      }
      
      // --- AÑADIDO: Si la BD tiene 'cursando', lo tratamos como 'pendiente' ---
      if (estadoFinal === 'cursando') {
        estadoFinal = 'pendiente';
      }
      asignaturaObj.estado = estadoFinal;
      // --- FIN DE LA MODIFICACIÓN ---
      
      // Borramos el objeto 'progreso' anidado para una respuesta más limpia
      delete asignaturaObj.progreso; 
      return asignaturaObj;
    });

    return ok(res, data);
  } catch (err) { // <-- Añadido catch
    next(err);
  }
};

/**
 * PUT /progreso
 * Actualiza (upsert) el estado de una asignatura para el usuario.
 * Body esperado: { "asignatura_sigla": "INF100", "estado": "aprobada" }
 */
exports.updateProgreso = async (req, res, next) => { // <-- Añadido next
  try { // <-- Añadido try
    const usuarioId = req.user.id;
    const { asignatura_sigla, estado } = req.body;

    // 1. Validar el input que envía el frontend
    if (!asignatura_sigla || !estado) {
      return fail(res, 'Los campos "asignatura_sigla" y "estado" son obligatorios', 400);
    }
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return fail(res, `Estado "${estado}" no es válido. Usar: ${ESTADOS_VALIDOS.join(', ')}`, 400);
    }

    // 2. (Opcional pero recomendado) Verificar que la asignatura exista
    const asignatura = await Asignatura.findOne({ 
      where: { sigla: asignatura_sigla }, 
      attributes: ['sigla'] 
    });

    if (!asignatura) {
      return fail(res, `Asignatura con sigla ${asignatura_sigla} no encontrada`, 404);
    }

    // 3. Usar Upsert (Update or Insert):
    const [registro, isCreated] = await ProgresoUsuario.upsert({
      usuario_id: usuarioId,
      asignatura_sigla: asignatura_sigla,
      estado: estado,
    }, {
      returning: true // Devuelve el registro actualizado/creado
    });

    // Devolvemos el registro y un booleano 'isCreated' por si el frontend lo necesita
    return ok(res, { registro, isCreated });
  } catch (err) { // <-- Añadido catch
    next(err);
  }
};