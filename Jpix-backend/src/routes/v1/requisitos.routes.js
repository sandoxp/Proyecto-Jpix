'use strict';
const router = require('express').Router();
const requisitosController = require('../../controllers/requisitos.controller');

router.get('/', requisitosController.list);
router.get('/:id', requisitosController.getOne);

module.exports = router;
