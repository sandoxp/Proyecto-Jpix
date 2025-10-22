'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = { // (ya corregimos el error 'Eports' aquí)
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'carrera', { // 👈 Corregido a minúscula
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('usuarios', 'periodo_malla', { // 👈 Corregido a minúscula
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuarios', 'carrera'); // 👈 Corregido a minúscula
    await queryInterface.removeColumn('usuarios', 'periodo_malla'); // 👈 Corregido a minúscula
  }
};