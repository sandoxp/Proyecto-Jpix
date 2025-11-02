'use strict';
const { validationResult } = require('express-validator');

exports.validate = (schemas) => [
  ...schemas,
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    return res.status(400).json({
      error: { message: 'Validación fallida', code: 400, details: errors.array() }
    });
  }
];
