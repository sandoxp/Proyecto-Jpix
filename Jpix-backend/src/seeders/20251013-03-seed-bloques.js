'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

function toInt(x) {
  if (x === null || x === undefined || x === '') return null;
  const v = Number(String(x).replace(',','.'));
  return Number.isFinite(v) ? Math.trunc(v) : null;
}
function cleanStr(x) {
  if (x === undefined || x === null) return null;
  const s = String(x).trim();
  return s === '' ? null : s;
}

module.exports = {
  async up (queryInterface, Sequelize) {
    const DATA = path.resolve(__dirname, '../../data');
    const files = ['bloques_horario.csv','bloques_horario_fofu.csv'];

    const seccs = await queryInterface.sequelize.query(`
      SELECT s.id, a.sigla, s.seccion
      FROM secciones s JOIN asignaturas a ON a.id = s.asignatura_id
    `, { type: Sequelize.QueryTypes.SELECT });

    const secIdByKey = new Map(seccs.map(r => [`${r.sigla}#${r.seccion}`, r.id]));

    const out = [];
    for (const f of files) {
      const p = path.join(DATA, f);
      if (!fs.existsSync(p)) continue;
      const rows = parse(fs.readFileSync(p, 'utf8'), { columns: true, skip_empty_lines: true });
      for (const r of rows) {
        const sigla = String(r.sigla || '').trim().toUpperCase();
        const key = `${sigla}#${String(r.seccion || '').trim()}`;
        const seccion_id = secIdByKey.get(key);
        if (!seccion_id) continue;
        out.push({
          seccion_id,
          dia: cleanStr(r.dia),
          clave_ini: toInt(r.clave_ini),
          clave_fin: toInt(r.clave_fin),
          actividad: cleanStr(r.actividad),
          sede: cleanStr(r.sede),
          sala: cleanStr(r.sala),
          paridad: cleanStr(r.paridad) || 'PAR',
          hora_inicio: cleanStr(r.hora_inicio),
          hora_fin: cleanStr(r.hora_fin),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    await queryInterface.bulkInsert('bloques_horario', out, {});
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('bloques_horario', null, {});
  }
};
