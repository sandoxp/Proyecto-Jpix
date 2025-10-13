'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('asignaturas', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        sigla: { type: Sequelize.STRING(40), allowNull: false, unique: true },
        nombre: { type: Sequelize.STRING(255), allowNull: false },
        tipo: { type: Sequelize.ENUM('obligatoria','fofu','ingles','optativa'), allowNull: true },
        creditos: { type: Sequelize.INTEGER, allowNull: true },
        periodo_malla: { type: Sequelize.INTEGER, allowNull: true },
        semestralidad: { type: Sequelize.ENUM('ANUAL','SEMESTRAL'), allowNull: true },
        tasa_aprobacion: { type: Sequelize.FLOAT, allowNull: true },
        tasa_aprobacion_pct: { type: Sequelize.STRING(16), allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction: t });

      await queryInterface.addIndex('asignaturas', ['sigla'], { name: 'idx_asig_sigla', unique: true, transaction: t });

      await queryInterface.createTable('secciones', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        asignatura_id: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: 'asignaturas', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
        },
        seccion: { type: Sequelize.STRING(8), allowNull: false },
        nombre: { type: Sequelize.STRING(255), allowNull: true },
        codigo_completo: { type: Sequelize.STRING(80), allowNull: true },
        docente: { type: Sequelize.STRING(255), allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction: t });

      await queryInterface.addConstraint('secciones', {
        fields: ['asignatura_id','seccion'],
        type: 'unique',
        name: 'uniq_secciones_asig_seccion',
        transaction: t
      });

      await queryInterface.createTable('bloques_horario', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        seccion_id: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: 'secciones', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
        },
        dia: { type: Sequelize.ENUM('LUN','MAR','MIE','JUE','VIE','SAB'), allowNull: true },
        clave_ini: { type: Sequelize.INTEGER, allowNull: true },
        clave_fin: { type: Sequelize.INTEGER, allowNull: true },
        actividad: { type: Sequelize.ENUM('CAT','TAL','AY'), allowNull: true },
        sede: { type: Sequelize.STRING(40), allowNull: true },
        sala: { type: Sequelize.STRING(40), allowNull: true },
        paridad: { type: Sequelize.ENUM('PAR','IMPAR','AMBOS'), allowNull: true, defaultValue: 'PAR' },
        hora_inicio: { type: Sequelize.TIME, allowNull: true },
        hora_fin: { type: Sequelize.TIME, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction: t });

      await queryInterface.createTable('requisitos', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        asignatura_id: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: 'asignaturas', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
        },
        requiere_id: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: 'asignaturas', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
        },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction: t });

      await queryInterface.addConstraint('requisitos', {
        fields: ['asignatura_id','requiere_id'],
        type: 'unique',
        name: 'uniq_requisitos_par',
        transaction: t
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('requisitos', { transaction: t });
      await queryInterface.dropTable('bloques_horario', { transaction: t });
      await queryInterface.dropTable('secciones', { transaction: t });
      await queryInterface.dropTable('asignaturas', { transaction: t });

      // limpiar ENUMs (solo si existen)
      const enums = [
        'enum_asignaturas_tipo','enum_asignaturas_semestralidad',
        'enum_bloques_horario_dia','enum_bloques_horario_actividad','enum_bloques_horario_paridad'
      ];
      for (const e of enums) {
        try { await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${e}"`, { transaction: t }); } catch {}
      }
    });
  }
};
