'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

module.exports = {
  async up (queryInterface, Sequelize) {
    const DATA = path.resolve(__dirname, '../../data');
    const file = fs.existsSync(path.join(DATA, 'prerequisitos_obligatorias_valid.csv'))
      ? 'prerequisitos_obligatorias_valid.csv'
      : 'prerequisitos_obligatorias.csv';

    if (!fs.existsSync(path.join(DATA, file))) return;

    const all = await queryInterface.sequelize.query(
      'SELECT id, sigla FROM asignaturas',
      { type: Sequelize.QueryTypes.SELECT }
    );
    const idBySigla = new Map(all.map(a => [a.sigla, a.id]));

    const rows = parse(fs.readFileSync(path.join(DATA, file), 'utf8'), {
      columns: true, skip_empty_lines: true
    });

    const out = [];
    const seen = new Set();
    for (const r of rows) {
      const a = idBySigla.get(String(r.sigla || '').trim().toUpperCase());
      const b = idBySigla.get(String(r.requiere_sigla || '').trim().toUpperCase());
      if (!a || !b || a === b) continue;
      const k = `${a}#${b}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ asignatura_id: a, requiere_id: b, createdAt: new Date(), updatedAt: new Date() });
    }

    if (out.length) await queryInterface.bulkInsert('requisitos', out, {});
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('requisitos', null, {});
  }
};
