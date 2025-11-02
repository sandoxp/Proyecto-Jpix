'use strict';

module.exports = (sequelize, DataTypes) => {
  const Requisito = sequelize.define('Requisito', {
    asignatura_id: { type: DataTypes.INTEGER, allowNull: false },
    requiere_id:   { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'requisitos',
    timestamps: true
  });

  // 🔧 agrega esto:
  Requisito.associate = (models) => {
    Requisito.belongsTo(models.Asignatura, { as: 'asignatura', foreignKey: 'asignatura_id' });
    Requisito.belongsTo(models.Asignatura, { as: 'requerida',  foreignKey: 'requiere_id'  }); // opcional pero útil
  };

  return Requisito;
};