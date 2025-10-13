// src/app.js
'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { errorHandler } = require('./middlewares/error.middleware');

// Rutas v1 (importa los archivos que SÍ exportan un router)
const healthRoutes = require('./routes/v1/health.routes');
const usersRoutes = require('./routes/v1/users.routes');
const asignaturasRoutes = require('./routes/v1/asignaturas.routes'); // opcional si lo añadiste

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Montaje de rutas (cada require debe exportar un Router)
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/usuarios', usersRoutes);
app.use('/api/v1/asignaturas', asignaturasRoutes);

// favicon vacío para evitar 404 ruidoso
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// 404 genérico
app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Not Found', code: 404 } });
});

// manejador de errores al final
app.use(errorHandler);

module.exports = { app };
