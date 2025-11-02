'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rut: {
        type: Sequelize.STRING(12),
        allowNull: false,
        unique: true
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      rol: {
        type: Sequelize.ENUM('admin', 'estudiante'),
        allowNull: false,
        defaultValue: 'estudiante'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // borrar tabla primero
    await queryInterface.dropTable('usuarios');

    // en Postgres hay que limpiar el tipo ENUM generado:
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      // nombre por defecto que genera Sequelize: enum_<tabla>_<columna>
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_usuarios_rol";');
    }
  }
};
