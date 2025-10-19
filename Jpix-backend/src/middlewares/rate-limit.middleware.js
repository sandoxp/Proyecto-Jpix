'use strict';
const rateLimit = require('express-rate-limit');
exports.authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }); // 50 intentos/15min