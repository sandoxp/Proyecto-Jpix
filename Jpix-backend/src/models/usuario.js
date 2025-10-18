'use strict';

module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
    rut:           { type: DataTypes.STRING, allowNull: false, unique: true },
    nombre:        { type: DataTypes.STRING, allowNull: false },
    email:         { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    rol:           { type: DataTypes.ENUM('admin','estudiante'), allowNull: false, defaultValue: 'estudiante' }
  }, {
    tableName: 'usuarios',
    timestamps: true
  });

  return Usuario;
};
