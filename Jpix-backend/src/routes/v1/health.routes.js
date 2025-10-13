// src/routes/v1/health.routes.js
'use strict';
const router = require('express').Router();

router.get('/', (_req, res) => res.status(200).json({ status: 'ok' }));

module.exports = router;
