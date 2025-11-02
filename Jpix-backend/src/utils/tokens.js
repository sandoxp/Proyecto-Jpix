'use strict';
const crypto = require('crypto');

exports.randomToken = (bytes = 64) => crypto.randomBytes(bytes).toString('hex');
exports.hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

exports.addDays = (date, d) => new Date(date.getTime() + d * 24 * 60 * 60 * 1000);
