'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('secciones', {
      sigla: {
        type: Sequelize.STRING(10),
        allowNull: false,
        references: {
          model: 'asignaturas',
          key: 'sigla',
        },
      },
      seccion: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      nombre: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      codigo_completo: {
        type: Sequelize.STRING(255),
        allowNull: false,
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
  // En Postgres, CASCADE elimina dependencias (FKs/tablas hijas)
  await queryInterface.dropTable('secciones', { cascade: true });
  }
};
