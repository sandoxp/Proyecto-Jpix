'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

function nint(x) {
  if (x === undefined || x === null || x === '') return null;
  const v = Number(String(x).replace(',', '.'));
  return Number.isFinite(v) ? Math.trunc(v) : null;
}
function nrate(x) {
  if (x === undefined || x === null || x === '') return null;
  let s = String(x).trim().replace('%','').replace(',','.');
  if (!s) return null;
  let v = Number(s);
  if (!Number.isFinite(v)) return null;
  if (v > 1) v = v/100;
  return v;
}

module.exports = {
  async up (queryInterface) {
    const DATA = path.resolve(__dirname, '../../data');
    const files = [
      { f: 'asignaturas_obligatorias_limpias.csv', tipo: 'obligatoria' },
      { f: 'asignaturas_fofu_limpias.csv', tipo: 'fofu' }
    ];

    const bySigla = new Map();

    for (const { f, tipo } of files) {
      const p = path.join(DATA, f);
      if (!fs.existsSync(p)) continue;
      const rows = parse(fs.readFileSync(p, 'utf8'), { columns: true, skip_empty_lines: true });
      for (const r of rows) {
        const sigla = String(r.sigla || r.Sigla || '').trim().toUpperCase();
        if (!sigla) continue;
        if (!bySigla.has(sigla)) {
          bySigla.set(sigla, {
            sigla,
            nombre: String(r.nombre || r.Nombre || '').trim(),
            tipo: String(r.tipo || tipo || '').toLowerCase() || null,
            creditos: nint(r.creditos || r.Créditos),
            periodo_malla: nint(r.periodo_malla),
            semestralidad: (r.semestralidad || null) && String(r.semestralidad).toUpperCase(),
            tasa_aprobacion: nrate(r.tasa_aprobacion || r['Tasa de Aprobación']),
            tasa_aprobacion_pct: r.tasa_aprobacion_pct || null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    await queryInterface.bulkInsert('asignaturas', Array.from(bySigla.values()), {});
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('asignaturas', null, {});
  }
};
