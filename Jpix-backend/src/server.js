// src/server.js
'use strict';
require('dotenv').config();   // 👈 Debe ir PRIMERO, antes de importar app/models/etc.

const { app } = require('./app');
const PORT = process.env.PORT || 3000;
const { sequelize } = require('./models');

// (opcional) Frena si falta el secreto, para no seguir con errores 500
if (!process.env.JWT_SECRET) {
  console.error('FALTA JWT_SECRET en el .env');
  process.exit(1);
}

(async () => {
  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query(`
      SELECT current_database() AS db, current_user AS usr,
             inet_server_addr() AS ip, inet_server_port() AS port
    `);
    const info = rows[0];
    const isAzure = (process.env.DB_HOST || '').includes('postgres.database.azure.com');
    console.log('BD OK:',
      { env: isAzure ? 'azure' : 'local/remoto',
        host: process.env.DB_HOST,
        ssl: process.env.DB_SSL === 'true',
        db: info.db, user: info.usr, ip: info.ip, port: info.port }
    );
  } catch (e) {
    console.error('Fallo conexión BD:', e.message, { host: process.env.DB_HOST });
  }
})();

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
