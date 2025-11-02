'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

function keep(s) {
  if (s === null || s === undefined) return null;
  const raw = String(s).trim();
  return raw || null;
}

module.exports = {
  async up (queryInterface, Sequelize) {
    const DATA = path.resolve(__dirname, '../../data');
    const files = ['secciones.csv','secciones_fofu.csv'];

    const asigs = await queryInterface.sequelize.query(
      'SELECT id, sigla FROM asignaturas', { type: Sequelize.QueryTypes.SELECT }
    );
    const asigIdBySigla = new Map(asigs.map(a => [a.sigla, a.id]));

    const rowsOut = [];
    for (const f of files) {
      const p = path.join(DATA, f);
      if (!fs.existsSync(p)) continue;
      const rows = parse(fs.readFileSync(p, 'utf8'), { columns: true, skip_empty_lines: true });
      for (const r of rows) {
        const sigla = String(r.sigla || r.Sigla || '').trim().toUpperCase();
        const asignatura_id = asigIdBySigla.get(sigla);
        if (!asignatura_id) continue;
        rowsOut.push({
          asignatura_id,
          seccion: keep(r.seccion || r.Seccion),
          nombre: keep(r.nombre || r.Nombre),
          codigo_completo: keep(r.codigo_completo || r.Codigo),
          docente: keep(r.docente),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    const key = new Set();
    const dedup = [];
    for (const x of rowsOut) {
      const k = `${x.asignatura_id}#${x.seccion}`;
      if (!key.has(k)) { key.add(k); dedup.push(x); }
    }
    await queryInterface.bulkInsert('secciones', dedup, {});
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('secciones', null, {});
  }
};
