'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const table = await queryInterface.describeTable('usuarios');

      // Agrega la columna sólo si no existe
      if (!table.password_hash) {
        await queryInterface.addColumn(
          'usuarios',
          'password_hash',
          { type: Sequelize.STRING, allowNull: true, defaultValue: '' },
          { transaction: t }
        );

        // Si necesitas rellenar filas antiguas con algún valor temporal o hash:
        // await queryInterface.sequelize.query(
        //   "UPDATE usuarios SET password_hash = '' WHERE password_hash IS NULL",
        //   { transaction: t }
        // );

        // Quita default y deja NOT NULL
        await queryInterface.sequelize.query(
          'ALTER TABLE usuarios ALTER COLUMN password_hash DROP DEFAULT',
          { transaction: t }
        );
        await queryInterface.changeColumn(
          'usuarios',
          'password_hash',
          { type: Sequelize.STRING, allowNull: false },
          { transaction: t }
        );
      }

      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface) {
    // Reverso de la migración
    await queryInterface.removeColumn('usuarios', 'password_hash');
  }
};

