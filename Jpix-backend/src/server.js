// src/server.js
'use strict';
require('dotenv').config();   // 👈 Debe ir PRIMERO, antes de importar app/models/etc.

const { app } = require('./app');
const PORT = process.env.PORT || 3000;

// (opcional) Frena si falta el secreto, para no seguir con errores 500
if (!process.env.JWT_SECRET) {
  console.error('FALTA JWT_SECRET en el .env');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
