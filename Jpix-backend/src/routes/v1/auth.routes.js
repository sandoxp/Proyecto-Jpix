'use strict';
const router = require('express').Router();
const C = require('../../controllers/auth.controller');
const { auth } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });

router.post('/register', authLimiter, validate([
  body('rut').notEmpty().withMessage('rut requerido'),
  body('nombre').notEmpty().withMessage('nombre requerido'),
  body('email').isEmail().withMessage('email inválido'),
  body('password').isLength({ min: 6 }).withMessage('password >= 6')
]), C.register);

router.post('/login', authLimiter, validate([
  body('password').notEmpty(),
  body().custom(v => v.email || v.rut).withMessage('email o rut requerido'),
  body('email').optional().isEmail().withMessage('email inválido')
]), C.login);

router.post('/refresh', authLimiter, validate([
  body('refreshToken').notEmpty().withMessage('refreshToken requerido')
]), C.refresh);

router.post('/logout', authLimiter, validate([
  body('refreshToken').notEmpty().withMessage('refreshToken requerido')
]), C.logout);

router.get('/me', auth, C.me);

module.exports = router;
