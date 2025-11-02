const { Sequelize } = require('sequelize');
const { DB } = require('./env');

const sequelize = new Sequelize(DB.NAME, DB.USER, DB.PASS, {
  host: DB.HOST,
  dialect: DB.DIALECT,
  port: DB.PORT,
  logging: false,
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL exitosa');
  } catch (error) {
    console.error('❌ Error de conexión a la base de datos:', error);
  }
}

module.exports = { sequelize, connectDB };
