'use strict';

const router = require('express').Router();
const { asyncH } = require('../../utils/async');
const C = require('../../controllers/secciones.controller');

// --- Importamos middlewares de admin ---
const { auth, requireRole } = require('../../middlewares/auth.middleware');

// --- RUTAS PÚBLICAS / DE ESTUDIANTE ---

// GET /api/v1/secciones
// (Lo modificaremos para que filtre por ?asignatura_id=)
router.get('/', asyncH(C.list));

// GET /api/v1/secciones/:id
router.get('/:id', asyncH(C.getOne));

// --- RUTAS DE ADMINISTRACIÓN (CRUD - EF 1) ---

/**
 * @api {post} /api/v1/secciones/
 * @description Crear una nueva sección (y sus bloques).
 * @access Admin
 */
router.post('/',
  auth,
  requireRole('admin'),
  asyncH(C.create)
);

/**
 * @api {put} /api/v1/secciones/:id
 * @description Actualizar una sección (y sus bloques).
 * @access Admin
 */
router.put('/:id',
  auth,
  requireRole('admin'),
  asyncH(C.update)
);

/**
 * @api {delete} /api/v1/secciones/:id
 * @description Eliminar una sección (y sus bloques).
 * @access Admin
 */
router.delete('/:id',
  auth,
  requireRole('admin'),
  asyncH(C.remove)
);

module.exports = router;