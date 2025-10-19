'use strict';

module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    token_hash:      { type: DataTypes.STRING(128), allowNull: false, unique: true },
    user_id:         { type: DataTypes.INTEGER, allowNull: false },
    expires_at:      { type: DataTypes.DATE,   allowNull: false },
    revoked_at:      { type: DataTypes.DATE },
    replaced_by_hash:{ type: DataTypes.STRING(128) }
  }, {
    tableName: 'refresh_tokens',
    timestamps: true
  });

  RefreshToken.associate = (models) => {
    RefreshToken.belongsTo(models.Usuario, { foreignKey: 'user_id', as: 'usuario' });
  };

  return RefreshToken;
};
