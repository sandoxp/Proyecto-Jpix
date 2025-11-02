'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('progreso_usuarios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios', // nombre de la tabla
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Si se borra el usuario, se borra su progreso
      },
      asignatura_sigla: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'asignaturas', // nombre de la tabla
          key: 'sigla'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Si se borra la asignatura, se borra el registro
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'aprobada', 'reprobada', 'cursando'),
        allowNull: false,
        defaultValue: 'pendiente'
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

    // Añadir el índice único que definimos en el modelo
    await queryInterface.addIndex('progreso_usuarios',
      ['usuario_id', 'asignatura_sigla'],
      { 
        unique: true, 
        name: 'progreso_usuario_asignatura_unique' 
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('progreso_usuarios');
  }
};