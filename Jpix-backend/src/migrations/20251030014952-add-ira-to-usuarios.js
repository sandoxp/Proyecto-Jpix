'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Comandos para añadir la columna 'ira' a la tabla 'usuarios'.
     */
    await queryInterface.addColumn('usuarios', 'ira', {
      type: Sequelize.ENUM('bajo', 'medio', 'alto'),
      allowNull: false,
      defaultValue: 'bajo'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Comandos para revertir los cambios (eliminar la columna 'ira').
     */
    await queryInterface.removeColumn('usuarios', 'ira');
  }
};