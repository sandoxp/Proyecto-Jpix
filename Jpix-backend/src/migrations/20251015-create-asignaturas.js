'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('asignaturas', {
      sigla: {
        type: Sequelize.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      nombre: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      creditos: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tasa_aprobacion: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      tasa_aprobacion_pct: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('asignaturas');
  }
};
