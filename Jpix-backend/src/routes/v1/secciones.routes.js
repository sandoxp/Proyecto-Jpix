'use strict';
const router = require('express').Router();
const seccionesController = require('../../controllers/secciones.controller');

router.get('/', seccionesController.list);
router.get('/:id', seccionesController.getOne);

module.exports = router;
