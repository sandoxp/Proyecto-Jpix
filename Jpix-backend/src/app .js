const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const v1 = require('./routes/v1');
const { errorHandler } = require('./middlewares/error.middleware');
const notFound = require('./middlewares/notFound.middleware');
const { connectDB, sequelize } = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/v1', v1);
app.use(notFound);
app.use(errorHandler);

(async () => {
  await connectDB();
  await sequelize.sync(); // sincroniza modelos
})();

module.exports = { app };
