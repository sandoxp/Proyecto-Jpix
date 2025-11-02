'use strict';

module.exports = (sequelize, DataTypes) => {
  const Seccion = sequelize.define('Seccion', {
    asignatura_id:  { type: DataTypes.INTEGER, allowNull: false },
    seccion:        { type: DataTypes.STRING, allowNull: false },
    nombre:         { type: DataTypes.STRING },
    codigo_completo:{ type: DataTypes.STRING },
    docente:        { type: DataTypes.STRING }
  }, {
    tableName: 'secciones',
    timestamps: true
  });

  Seccion.associate = (models) => {
    Seccion.belongsTo(models.Asignatura, { foreignKey: 'asignatura_id', as: 'asignatura' });
    Seccion.hasMany(models.BloqueHorario, { foreignKey: 'seccion_id', as: 'bloques' });
  };

  return Seccion;
};
