require('dotenv').config();

exports.PORT = process.env.PORT || 3000;
exports.NODE_ENV = process.env.NODE_ENV || 'development';

exports.DB = {
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER || 'postgres',
  PASS: process.env.DB_PASS || '',
  NAME: process.env.DB_NAME || 'jpix_db',
  DIALECT: process.env.DB_DIALECT || 'postgres',
  PORT: process.env.DB_PORT || 5432,
};
