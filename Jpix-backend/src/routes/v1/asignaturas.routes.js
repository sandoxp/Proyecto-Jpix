'use strict';

const router = require('express').Router();
const { asyncH } = require('../../utils/async');
const C = require('../../controllers/asignaturas.controller');

// --- MODIFICADO: Importamos middlewares de admin ---
const { auth, requireRole } = require('../../middlewares/auth.middleware');

// --- RUTAS PÚBLICAS Y DE ESTUDIANTE ---

// Ruta pública que lista siglas (GET /)
router.get('/', asyncH(C.list));

// Ruta PRIVADA que trae el catálogo filtrado para el usuario logueado
// DEBE IR ANTES QUE LA RUTA DINÁMICA /:sigla
router.get(
  '/mi-catalogo',
  auth, // <-- ¡Este era el nombre correcto!
  asyncH(C.getMiCatalogo) 
);

// Ruta pública para ver el detalle de UNA asignatura
// Esta ruta dinámica debe ir al final
router.get('/:sigla', asyncH(C.getOne));


// --- RUTAS DE ADMINISTRACIÓN (CRUD - EF 1) ---
// (Protegidas con auth y requireRole('admin') igual que users.routes.js)

/**
 * @api {post} /api/v1/asignaturas/
 * @description Crear una nueva asignatura.
 * @access Admin
 */
router.post('/',
  auth,
  requireRole('admin'),
  asyncH(C.create) 
);

/**
 * @api {put} /api/v1/asignaturas/:sigla
 * @description Actualizar una asignatura existente, identificada por su sigla.
 * @access Admin
 */
router.put('/:sigla',
  auth,
  requireRole('admin'),
  asyncH(C.update) 
);

/**
 * @api {delete} /api/v1/asignaturas/:sigla
 * @description Eliminar una asignatura, identificada por su sigla.
 * @access Admin
 */
router.delete('/:sigla',
  auth,
  requireRole('admin'),
  asyncH(C.remove) 
);

module.exports = router;