'use strict';
const router = require('express').Router();
const { asyncH } = require('../../utils/async');
const C = require('../../controllers/users.controller');
const { auth, requireRole } = require('../../middlewares/auth.middleware');

// Self (usuario autenticado)
router.get('/me', auth, asyncH(C.me));
router.put('/me', auth, asyncH(C.updateSelf));

// Administración (solo admin)
router.get('/',     auth, requireRole('admin'), asyncH(C.list));
router.get('/:id',  auth, requireRole('admin'), asyncH(C.getOne));
router.post('/',    auth, requireRole('admin'), asyncH(C.create));
router.put('/:id',  auth, requireRole('admin'), asyncH(C.update));
router.delete('/:id', auth, requireRole('admin'), asyncH(C.remove));

module.exports = router;
