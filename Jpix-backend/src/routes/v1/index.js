'use strict';
const router = require('express').Router();


router.use('/health', require('./health.routes'));
router.use('/usuarios', require('./users.routes'));
router.use('/asignaturas', require('./asignaturas.routes'));
router.use('/secciones', require('./secciones.routes'));
router.use('/bloques', require('./bloques.routes'));
router.use('/requisitos', require('./requisitos.routes'));


module.exports = router;