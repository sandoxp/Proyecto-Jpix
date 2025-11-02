'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    // Leemos el esquema real por si tus columnas cambian
    const cols = await queryInterface.describeTable('usuarios');

    // Utilidad: asigna el campo correcto según exista password_hash o password
    const withPassword = async (user, plain) => {
      const hashed = await bcrypt.hash(plain, 10);
      if (cols.password_hash) {
        user.password_hash = hashed;
      } else if (cols.password) {
        user.password = hashed;
      } else {
        // Si tu tabla tuviera otro nombre, puedes agregar más ramas aquí
        throw new Error('La tabla usuarios no tiene password_hash ni password');
      }
      return user;
    };

    const now = new Date();
    const baseAdmin = {
      rut: '11111111-1',                // <- NOT NULL en tu esquema
      nombre: 'Administrador',
      email: 'admin@jpix.cl',
      rol: 'admin',
      createdAt: now,
      updatedAt: now
    };
    const baseStu = {
      rut: '22222222-2',
      nombre: 'Estudiante Prueba',
      email: 'estudiante@jpix.cl',
      rol: 'estudiante',
      createdAt: now,
      updatedAt: now
    };

    const admin = await withPassword(baseAdmin, 'admin123');
    const estudiante = await withPassword(baseStu, 'test1234');

    await queryInterface.bulkInsert('usuarios', [admin, estudiante], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', {
      email: ['admin@jpix.cl', 'estudiante@jpix.cl']
    }, {});
  }
};
