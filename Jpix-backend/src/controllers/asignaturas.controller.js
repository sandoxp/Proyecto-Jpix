// --- MODIFICADO: Añadido 'Usuario' y 'ProgresoUsuario' ---
const { Asignatura, Seccion, BloqueHorario, sequelize, Usuario, ProgresoUsuario } = require('../models');
const { ok, fail } = require('../utils/responses');
const { Op } = require('sequelize');

exports.list = async (_req, res) => {
  const data = await Asignatura.findAll({
    order: [['sigla', 'ASC']],
    attributes: ['sigla', 'nombre', 'creditos']
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

// --- FUNCIÓN MODIFICADA DRÁSTICAMENTE ---
/**
 * Obtiene el catálogo inteligente para el usuario autenticado.
 * - Muestra solo asignaturas pendientes o reprobadas por el usuario.
 * - Muestra siempre las FOFU.
 * - Ordena poniendo las reprobadas primero.
 * - Incluye secciones y bloques.
 */
exports.getMiCatalogo = async (req, res, next) => {
  try {
    const usuarioId = req.user.id;

    // 1. Obtener TODAS las asignaturas, incluyendo su estado de progreso
    //    para el usuario actual (LEFT JOIN).
    const todasConProgreso = await Asignatura.findAll({
      include: [
        {
          model: ProgresoUsuario,
          as: 'progreso',
          where: { usuario_id: usuarioId },
          required: false, // LEFT JOIN
          attributes: ['estado']
        },
        // Incluimos secciones y bloques directamente aquí
        {
          model: Seccion, 
          as: 'secciones',
          include: [{ model: BloqueHorario, as: 'bloques' }]
        }
      ],
      // No filtramos aún, traemos todo para determinar el estado
    });

    // 2. Procesar y FILTRAR la lista en memoria
    const catalogoFiltrado = todasConProgreso
      .map(a => {
        const asignaturaObj = a.get({ plain: true });
        let estadoFinal = 'pendiente'; // Default
        if (asignaturaObj.progreso && asignaturaObj.progreso.length > 0) {
           // Corregimos 'cursando' si aún existe en BD
          estadoFinal = asignaturaObj.progreso[0].estado === 'cursando' ? 'pendiente' : asignaturaObj.progreso[0].estado;
        }
        asignaturaObj.estado = estadoFinal;
        delete asignaturaObj.progreso; // Limpiamos
        return asignaturaObj;
      })
      .filter(a => 
         // Mostrar si está pendiente O reprobada O si es FOFU
         a.estado === 'pendiente' || a.estado === 'reprobada' || a.tipo === 'fofu'
         // (Las FOFU siempre aparecen, asumimos que no tienen progreso guardado)
         // OJO: Si quieres que las FOFU también se puedan marcar como 'aprobada'
         // y ocultarlas, quita '|| a.tipo === 'fofu'' y asegúrate
         // de que se puedan marcar en la página de progreso.
      );

    // 3. ORDENAR: Reprobadas primero, luego por semestre, luego por sigla
    catalogoFiltrado.sort((a, b) => {
      // Prioridad 1: Reprobadas van primero
      if (a.estado === 'reprobada' && b.estado !== 'reprobada') return -1;
      if (a.estado !== 'reprobada' && b.estado === 'reprobada') return 1;

      // Prioridad 2: Ordenar por semestre (si ambas son reprobadas o ambas pendientes)
      const semestreA = a.periodo_malla ?? Infinity; // FOFU al final
      const semestreB = b.periodo_malla ?? Infinity;
      if (semestreA !== semestreB) {
        return semestreA - semestreB;
      }
      
      // Prioridad 3: Ordenar por sigla si tienen mismo estado y semestre
      return a.sigla.localeCompare(b.sigla);
    });

    return ok(res, catalogoFiltrado);

  } catch (err) {
    next(err);
  }
};
// --- FIN DE LA FUNCIÓN MODIFICADA ---