'use strict';
const router = require('express').Router();
const ctrl = require('../../controllers/auth.controller');
const { auth } = require('../../middlewares/auth.middleware');

router.post('/register', ctrl.register);   // opcional si crearás cuentas desde la app
router.post('/login', ctrl.login);
router.get('/me', auth, ctrl.me);

module.exports = router;
