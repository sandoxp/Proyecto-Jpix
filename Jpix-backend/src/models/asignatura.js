'use strict';

module.exports = (sequelize, DataTypes) => {
  const Asignatura = sequelize.define('Asignatura', {
    sigla:               { type: DataTypes.STRING, allowNull: false, unique: true },
    nombre:              { type: DataTypes.STRING, allowNull: false },
    tipo:                { type: DataTypes.ENUM('obligatoria','fofu','ingles','optativa') },
    creditos:            { type: DataTypes.INTEGER },
    periodo_malla:       { type: DataTypes.INTEGER },
    semestralidad:       { type: DataTypes.ENUM('ANUAL','SEMESTRAL') },
    tasa_aprobacion:     { type: DataTypes.FLOAT },
    tasa_aprobacion_pct: { type: DataTypes.STRING }
  }, {
    tableName: 'asignaturas',
    timestamps: true
  });

  Asignatura.associate = (models) => {
    Asignatura.hasMany(models.Seccion, { foreignKey: 'asignatura_id', as: 'secciones' });
    Asignatura.belongsToMany(models.Asignatura, {
      through: models.Requisito,
      as: 'requisitos',
      foreignKey: 'asignatura_id',
      otherKey: 'requiere_id'
    });

    // --- AÑADIDO ---
    // Una asignatura (identificada por su sigla) puede estar en el progreso de muchos usuarios
    Asignatura.hasMany(models.ProgresoUsuario, {
      foreignKey: 'asignatura_sigla', // La columna en ProgresoUsuario
      sourceKey: 'sigla',            // La columna en Asignatura con la que se enlaza
      as: 'progreso'
    });
    // --- FIN DE LO AÑADIDO ---
  };

  return Asignatura;
};