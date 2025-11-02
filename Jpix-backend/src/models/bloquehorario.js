'use strict';

module.exports = (sequelize, DataTypes) => {
  const BloqueHorario = sequelize.define('BloqueHorario', {
    seccion_id:   { type: DataTypes.INTEGER, allowNull: false },
    dia:          { type: DataTypes.ENUM('LUN','MAR','MIE','JUE','VIE','SAB') },
    clave_ini:    { type: DataTypes.INTEGER },
    clave_fin:    { type: DataTypes.INTEGER },
    actividad:    { type: DataTypes.ENUM('CAT','TAL','AY') },
    sede:         { type: DataTypes.STRING },
    sala:         { type: DataTypes.STRING },
    paridad:      { type: DataTypes.ENUM('PAR','IMPAR','AMBOS') },
    hora_inicio:  { type: DataTypes.TIME },
    hora_fin:     { type: DataTypes.TIME }
  }, {
    tableName: 'bloques_horario',
    timestamps: true
  });

  BloqueHorario.associate = (models) => {
    BloqueHorario.belongsTo(models.Seccion, { foreignKey: 'seccion_id', as: 'seccion' });
  };

  return BloqueHorario;
};
