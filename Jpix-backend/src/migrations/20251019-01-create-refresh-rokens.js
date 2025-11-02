'use strict';

module.exports = {
  async up(q, S) {
    await q.createTable('refresh_tokens', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      token_hash: { type: S.STRING(128), allowNull: false, unique: true },
      user_id: { type: S.INTEGER, allowNull: false,
        references: { model: 'usuarios', key: 'id' }, onDelete: 'CASCADE' },
      expires_at: { type: S.DATE, allowNull: false },
      revoked_at: { type: S.DATE },
      replaced_by_hash: { type: S.STRING(128) },
      createdAt: { type: S.DATE, allowNull: false, defaultValue: S.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: S.DATE, allowNull: false, defaultValue: S.literal('CURRENT_TIMESTAMP') }
    });
    await q.addIndex('refresh_tokens', ['user_id']);
  },

  async down(q) {
    await q.dropTable('refresh_tokens');
  }
};
