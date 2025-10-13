// src/routes/v1/users.routes.js
'use strict';
const router = require('express').Router();
const ctrl = require('../../controllers/users.controller');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
