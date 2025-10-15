'use strict';
const router = require('express').Router();
const bloquesController = require('../../controllers/bloques.controller');

router.get('/', bloquesController.list);
router.get('/:id', bloquesController.getOne);

module.exports = router;
