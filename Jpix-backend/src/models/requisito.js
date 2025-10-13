'use strict';

module.exports = (sequelize, DataTypes) => {
  const Requisito = sequelize.define('Requisito', {
    asignatura_id: { type: DataTypes.INTEGER, allowNull: false },
    requiere_id:   { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'requisitos',
    timestamps: true
  });

  // Relaciones “self-join” ya quedan en Asignatura.belongsToMany(...)
  return Requisito;
};
