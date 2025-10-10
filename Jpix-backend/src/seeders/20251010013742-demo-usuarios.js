'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('usuarios', [
      {
        nombre: 'Administrador',
        email: 'admin@jpix.cl',
        rol: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Estudiante Prueba',
        email: 'estudiante@jpix.cl',
        rol: 'estudiante',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('usuarios', null, {});
  }
};
