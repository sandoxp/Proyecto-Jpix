'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { errorHandler } = require('./middlewares/error.middleware');

// Rutas v1 (importa los archivos que SÍ exportan un router)
const healthRoutes = require('./routes/v1/health.routes');
const usersRoutes = require('./routes/v1/users.routes');
const asignaturasRoutes = require('./routes/v1/asignaturas.routes');
const seccionesRoutes = require('./routes/v1/secciones.routes'); // Rutas de Secciones
const bloquesRoutes = require('./routes/v1/bloques.routes'); // Rutas de Bloques Horarios
const requisitosRoutes = require('./routes/v1/requisitos.routes'); // Rutas de Requisitos
const authRoutes = require('./routes/v1/auth.routes');
const progresoRoutes = require('./routes/v1/progreso.routes'); // <-- AÑADIDO

const app = express();

app.disable('x-powered-by');

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Montaje de rutas (cada require debe exportar un Router)
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/usuarios', usersRoutes);
app.use('/api/v1/asignaturas', asignaturasRoutes);
app.use('/api/v1/secciones', seccionesRoutes); // Ruta de Secciones
app.use('/api/v1/bloques', bloquesRoutes); // Ruta de Bloques Horarios
app.use('/api/v1/requisitos', requisitosRoutes); // Ruta de Requisitos
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/progreso', progresoRoutes); // <-- AÑADIDO


// favicon vacío para evitar 404 ruidoso
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// 404 genérico para rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Not Found', code: 404 } });
});

const corsOptions = {
  origin: ['http://localhost:8100', 'http://localhost:4200'],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
};
app.use(cors(corsOptions));

// Manejador de errores al final
app.use(errorHandler);

module.exports = { app };