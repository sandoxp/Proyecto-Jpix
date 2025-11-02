'use strict';
const router = require('express').Router();
const { asyncH } = require('../../utils/async');
const C = require('../../controllers/progreso.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

// Todas las rutas de progreso requieren autenticación
// Se aplica a todas las rutas definidas en este archivo
router.use(authMiddleware.auth);

// GET /api/v1/progreso
// Obtiene la malla completa con el estado de progreso del usuario
router.get('/', asyncH(C.getProgreso));

// PUT /api/v1/progreso
// Actualiza (o crea) el estado de una asignatura para el usuario
router.put('/', asyncH(C.updateProgreso));

module.exports = router;