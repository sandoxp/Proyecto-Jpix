'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bloques_horarios', {
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
      dia: {
        type: Sequelize.STRING(3),
        allowNull: false,
      },
      hora_inicio: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      hora_fin: {
        type: Sequelize.TIME,
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
    await queryInterface.dropTable('bloques_horarios');
  }
};
