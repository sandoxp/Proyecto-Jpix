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
    // --- CAMBIO: Leemos los archivos de *bloques* ---
    const files = ['bloques_horario.csv', 'bloques_horario_fofu.csv'];

    // 1. Obtener el mapa de Asignaturas (igual que antes)
    const asigs = await queryInterface.sequelize.query(
      'SELECT id, sigla FROM asignaturas', { type: Sequelize.QueryTypes.SELECT }
    );
    const asigIdBySigla = new Map(asigs.map(a => [a.sigla, a.id]));

    // --- CAMBIO: Lógica de deduplicación mejorada ---
    
    // Usaremos un Map para guardar la *primera* fila que veamos
    // de cada sección. El CSV de bloques tiene la
    // sigla y la sección en cada fila.
    const uniqueSeccionesMap = new Map();

    for (const f of files) {
      const p = path.join(DATA, f);
      if (!fs.existsSync(p)) continue;
      
      const rows = parse(fs.readFileSync(p, 'utf8'), { columns: true, skip_empty_lines: true });

      for (const r of rows) {
        const sigla = String(r.sigla || r.Sigla || '').trim().toUpperCase();
        const seccionNum = keep(r.seccion || r.Seccion);
        
        if (!sigla || !seccionNum) continue; // Ignorar filas sin sigla o sección

        const asignatura_id = asigIdBySigla.get(sigla);
        if (!asignatura_id) continue; // Ignorar si la asignatura no existe

        const key = `${asignatura_id}#${seccionNum}`;

        // Si es la primera vez que vemos esta sección, la guardamos
        if (!uniqueSeccionesMap.has(key)) {
          uniqueSeccionesMap.set(key, {
            asignatura_id,
            seccion: seccionNum,
            // (El CSV de bloques no tiene 'nombre' o 'docente',
            // si los tuvieras, los sacarías de 'r' aquí)
            nombre: keep(r.nombre_seccion) || null, // Asume una columna (o déjalo null)
            docente: keep(r.docente) || null,    // Asume una columna (o déjalo null)
            codigo_completo: `${sigla}-${seccionNum}`, // Creamos un código
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }
    
    // Convertimos el Map a un Array e insertamos
    const seccionesUnicas = Array.from(uniqueSeccionesMap.values());
    
    if (seccionesUnicas.length > 0) {
      await queryInterface.bulkInsert('secciones', seccionesUnicas, {});
    }
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('secciones', null, {});
  }
};