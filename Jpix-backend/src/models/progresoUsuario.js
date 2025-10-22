'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProgresoUsuario = sequelize.define('ProgresoUsuario', {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { 
        model: 'usuarios', // Nombre de la tabla
        key: 'id' 
      }
    },
    asignatura_sigla: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { 
        model: 'asignaturas', // Nombre de la tabla
        key: 'sigla' 
      }
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'aprobada', 'reprobada', 'cursando'),
      allowNull: false,
      defaultValue: 'pendiente'
    }
  }, {
    tableName: 'progreso_usuarios',
    timestamps: true, // Para saber cuándo se actualizó el estado por última vez
    indexes: [
      // Asegura que solo haya un registro por cada par usuario-asignatura
      { 
        unique: true, 
        fields: ['usuario_id', 'asignatura_sigla'],
        name: 'progreso_usuario_asignatura_unique'
      }
    ]
  });

  ProgresoUsuario.associate = (models) => {
    // Un registro de progreso PERTENECE A un Usuario
    ProgresoUsuario.belongsTo(models.Usuario, { 
      foreignKey: 'usuario_id', 
      as: 'usuario' 
    });
    // Un registro de progreso PERTENECE A una Asignatura
    ProgresoUsuario.belongsTo(models.Asignatura, { 
      foreignKey: 'asignatura_sigla', 
      targetKey: 'sigla', // Se enlaza con la columna 'sigla' de Asignatura
      as: 'asignatura' 
    });
  };

  return ProgresoUsuario;
};