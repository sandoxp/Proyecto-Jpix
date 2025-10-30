'use strict';

module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
    rut:           { type: DataTypes.STRING, allowNull: false, unique: true },
    nombre:        { type: DataTypes.STRING, allowNull: false },
    email:         { type: DataTypes.STRING, allowNull: false, unique: true },
    carrera:       { type: DataTypes.STRING, allowNull: true },
    periodo_malla: { type: DataTypes.INTEGER, allowNull: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    rol:           { type: DataTypes.ENUM('admin','estudiante'), allowNull: false, defaultValue: 'estudiante' },
    
    // --- CAMPO AÑADIDO ---
    ira: {
      type: DataTypes.ENUM('bajo', 'medio', 'alto'),
      allowNull: false,
      defaultValue: 'bajo'
    }
    // --- FIN DE LO AÑADIDO ---

  }, {
    tableName: 'usuarios',
    timestamps: true
  });

  Usuario.associate = (models) => {
    // Un usuario tiene muchos registros de progreso
    Usuario.hasMany(models.ProgresoUsuario, {
      foreignKey: 'usuario_id',
      as: 'progreso'
    });
    
    // (Aquí puedes añadir otras asociaciones futuras, como con RefreshToken si quisieras)
  };

  return Usuario;
};