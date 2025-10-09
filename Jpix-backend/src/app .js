const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { errorHandler } = require('./middlewares/error.middleware');
const healthRoutes = require('./routes/v1/health.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/v1/health', healthRoutes);
// en app.js, antes del errorHandler
app.get('/favicon.ico', (_req, res) => res.status(204).end());

app.use(errorHandler);

module.exports = { app };   // 👈 exporta { app }
