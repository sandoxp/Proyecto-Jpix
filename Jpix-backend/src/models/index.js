'use strict';
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../../config/config.js')[env];

const db = {};
const sequelize = new Sequelize(config.database, config.username, config.password, config);

function isClass(fn) {
  if (typeof fn !== 'function') return false;
  const src = Function.prototype.toString.call(fn);
  return /^class\s/.test(src);
}

fs.readdirSync(__dirname)
  .filter(file =>
    file !== basename &&
    file.endsWith('.js') &&
    !file.endsWith('.d.ts')
  )
  .forEach(file => {
    const full = path.join(__dirname, file);
    const mod = require(full);
    const factory = (typeof mod === 'function' ? mod
                    : (mod && typeof mod.default === 'function' ? mod.default : null));

    if (!factory || isClass(factory)) {
      console.warn(`[models] Omitiendo "${file}" (no es factory function).`);
      return;
    }

    const model = factory(sequelize, Sequelize.DataTypes);
    if (!model || !model.name) {
      console.warn(`[models] Omitiendo "${file}" (no devolvió un modelo válido).`);
      return;
    }
    db[model.name] = model;
  });

// asociaciones si existen
Object.keys(db).forEach(name => {
  if (typeof db[name].associate === 'function') {
    db[name].associate(db);
  }
});



db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
