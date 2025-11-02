'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('requisitos', {
      sigla: {
        type: Sequelize.STRING(10),
        allowNull: false,
        references: {
          model: 'asignaturas',
          key: 'sigla',
        },
      },
      requiere_sigla: {
        type: Sequelize.STRING(10),
        allowNull: false,
        references: {
          model: 'asignaturas',
          key: 'sigla',
        },
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
    await queryInterface.dropTable('requisitos');
  }
};
