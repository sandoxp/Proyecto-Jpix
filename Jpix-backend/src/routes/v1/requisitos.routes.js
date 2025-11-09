'use strict';

const router = require('express').Router();
const { asyncH } = require('../../utils/async');
const C = require('../../controllers/requisitos.controller');

// --- Importamos middlewares de admin ---
const { auth, requireRole } = require('../../middlewares/auth.middleware');

// --- RUTAS DE GESTIÓN ---

/**
 * @api {get} /api/v1/requisitos/
 * @description Lista requisitos.
 * @query ?asignatura_sigla=INF101 - Filtra por la sigla de la asignatura "dueña"
 */
router.get('/', asyncH(C.list));

/**
 * @api {get} /api/v1/requisitos/:id
 * @description Obtiene una entrada de requisito por su ID (de la tabla 'requisitos')
 */
router.get('/:id', asyncH(C.getOne));

// ==============================================================
// --- INICIO: NUEVA FUNCIÓN PARA EL CHAT (PASO 2) ---
// ==============================================================
/**
 * @api {get} /api/v1/requisitos/verificar/:sigla
 * @description Verifica si el usuario logueado CUMPLE los prerrequisitos de una asignatura.
 * @access Estudiante (autenticado)
 */
router.get(
  '/verificar/:sigla',
  auth, // <-- ¡Importante! Necesita 'auth' para saber quién es 'req.user'
  asyncH(C.verificar)
);
// ==============================================================
// --- FIN DE LA NUEVA RUTA ---
// ==============================================================

/**
 * @api {post} /api/v1/requisitos/
 * @description Crea una nueva relación de requisito.
 * @access Admin
 */
router.post('/',
  auth,
  requireRole('admin'),
  asyncH(C.create)
);

/**
 * @api {delete} /api/v1/requisitos/:id
 * @description Elimina una relación de requisito por su ID.
 * @access Admin
 */
router.delete('/:id',
  auth,
  requireRole('admin'),
  asyncH(C.remove)
);

module.exports = router;