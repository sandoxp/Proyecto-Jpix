'use strict';

module.exports = (sequelize, DataTypes) => {
  const Requisito = sequelize.define('Requisito', {
    asignatura_id: { type: DataTypes.INTEGER, allowNull: false },
    requiere_id:   { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'requisitos',
    timestamps: true
  });

  // Esta asociación es clave para que el controlador funcione
  Requisito.associate = (models) => {
    // La asignatura "dueña" del requisito
    Requisito.belongsTo(models.Asignatura, { as: 'asignatura', foreignKey: 'asignatura_id' });
    // La asignatura que "es" el requisito
    Requisito.belongsTo(models.Asignatura, { as: 'requerida',  foreignKey: 'requiere_id'   });
  };

  return Requisito;
};