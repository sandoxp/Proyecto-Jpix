'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Añadimos un índice compuesto.
     * La consulta en 'users.controller' filtra por 'tipo' (igualdad) y 'periodo_malla' (rango).
     * Este índice hará que esa consulta sea casi instantánea.
     */
    await queryInterface.addIndex('asignaturas', {
      fields: ['tipo', 'periodo_malla'],
      name: 'asignaturas_tipo_periodo_malla_idx' // Un nombre para el índice
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Esto permite revertir la migración (db:migrate:undo)
    await queryInterface.removeIndex('asignaturas', 'asignaturas_tipo_periodo_malla_idx');
  }
};