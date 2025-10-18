# Jpix — Informe 2 (EP 2.1)

**Objetivo del hito:** levantar el backend base con **Node.js + Express**, listo para crecer en EP 2.2–2.6 sin reordenar nada.  
Incluye middlewares, versionado de API y un **healthcheck**.

## 📦 Estructura del repo (monorepo)
```
JPIX-PROYECTO/
├─ Jpix/           # Frontend (Ionic + Angular)
└─ jpix-backend/   # Backend (Node + Express)  ← este README
```
---

## ✅ Requisitos
- Node.js 18+ y npm
- (Opcional) Postman/Insomnia para probar la API

---

## 🔧 Instalación (sólo primera vez)
```bash
cd jpix-backend
npm init -y
npm i express cors morgan
npm i -D nodemon
```

Crear `.env.example`:
```
PORT=3000
```
(Para correr localmente puedes copiarlo a `.env`).

---

## 📁 Archivos creados (mínimos EP 2.1)

```
jpix-backend/
└─ src/
   ├─ server.js
   ├─ app.js
   ├─ config/
   │   └─ env.js
   ├─ middlewares/
   │   └─ error.middleware.js
   └─ routes/
       └─ v1/
           └─ health.routes.js
```

**src/server.js**
```js
const { app } = require('./app');
const { PORT } = require('./config/env');

app.listen(PORT, () => {
  console.log(`Jpix API escuchando en http://localhost:${PORT}`);
});
```

**src/app.js**
```js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { errorHandler } = require('./middlewares/error.middleware');
const healthRoutes = require('./routes/v1/health.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/v1/health', healthRoutes);

// opcional: evitar 404 por favicon
app.get('/favicon.ico', (_req, res) => res.status(204).end());

app.use(errorHandler); // siempre al final

module.exports = { app };
```

**src/config/env.js**
```js
require('dotenv').config();
exports.PORT = process.env.PORT || 3000;
```

**src/middlewares/error.middleware.js**
```js
exports.errorHandler = (err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: { message: err.message || 'Error interno', code: status }
  });
};
```

**src/routes/v1/health.routes.js**
```js
const router = require('express').Router();
router.get('/', (_req, res) => res.status(200).json({ status: 'ok' }));
module.exports = router;
```

---

## 🏃‍♀️ Scripts de ejecución
Agregados en `package.json`:
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

### Correr en desarrollo
```bash
npm run dev
```
La API queda en: `http://localhost:3000`

---

## ✅ Verificación (healthcheck)
Probar en navegador o Postman:
```
GET http://localhost:3000/api/v1/health
```
**Respuesta esperada:**
```json
{ "status": "ok" }
```

---

## 📐 Convenciones que quedan fijas (para no reescribir después)
- **Prefijo de API:** `/api/v1/*`
- **Middlewares globales:** `express.json()`, `cors()`, logger (`morgan`) y `errorHandler`
- **Formato recomendado de respuestas:**
  - OK → `{ "data": ... }`
  - Error → `{ "error": { "message": "...", "code": 400|401|... } }`
- **Códigos de estado:** 200/201/204 (OK/creado/borrado), 400, 401, 403, 404, 500

---

## 🧩 Próximos pasos (no implementados aún)
- **EP 2.2 — BD relacional:** crear `config/db.js` (pool con `pg` o `mysql2`), modelos SQL y seeds.
- **EP 2.3 — Endpoints básicos:** `routes/controllers/services/repositories` para `/courses` (GET/POST/PUT/DELETE).
- **EP 2.4 — Integración con Ionic:** `environment.API_URL` en front y uso de `HttpClient` contra `http://localhost:3000/api/v1/...`
- **EP 2.5/2.6 — Autenticación JWT:** rutas `/auth` (login/register), `bcrypt`, `jsonwebtoken` y `auth.middleware`.

---

## 🧰 Troubleshooting
- **`Cannot find module './app'`**  
  Asegúrate de que `src/app.js` exporte `module.exports = { app }` y que `server.js` importe `const { app } = require('./app')`.
- **CORS bloqueado desde Ionic**  
  Confirmar `app.use(cors())` en `app.js`.
- **El puerto ya está en uso**  
  Cambia `PORT` en `.env`.

---

## 📝 Commit sugerido
```bash
git add .
git commit -m "feat(backend): base Express con /api/v1/health, CORS y error handler (EP 2.1)"
git push
```
Opcional:
```bash
git tag ep-2.1
git push --tags
```

# Jpix — Informe 2 (EP 2.2)

**Objetivo del hito:**  
Configurar la **base de datos relacional con PostgreSQL** e integrarla al backend Express mediante **Sequelize ORM**.  
Incluye conexión mediante `.env`, creación de usuario/base local, migraciones y seeders.

---

## 📦 Estructura del repo (monorepo)

```
JPIX-PROYECTO/
├─ Jpix/                # Frontend (Ionic + Angular)
└─ jpix-backend/        # Backend (Node + Express + PostgreSQL)
```

---

## ✅ Requisitos

- Node.js 18+ y npm  
- PostgreSQL 14 o superior (idealmente v18)  
- pgAdmin 4 (opcional, para administrar la base visualmente)  
- (Opcional) Postman o Insomnia para probar la API  

---

## 🧱 Instalación y configuración de PostgreSQL (solo primera vez)

1. **Descargar PostgreSQL** desde  
   👉 [https://www.postgresql.org/download/](https://www.postgresql.org/download/)

2. **Instalar** dejando las opciones por defecto:
   - Usuario administrador: `postgres`
   - Contraseña: (elige una y recuérdala)
   - Puerto: `5432`
   - Incluye **pgAdmin 4**

3. **Crear usuario y base de datos del proyecto**  
   Abrir `psql` o el panel de consultas de pgAdmin y ejecutar:

   ```sql
   CREATE ROLE jpix_user WITH LOGIN PASSWORD 'admin123';
   ALTER ROLE jpix_user CREATEDB;
   CREATE DATABASE jpix_db OWNER jpix_user;
   GRANT ALL PRIVILEGES ON DATABASE jpix_db TO jpix_user;
   ```

**📌 Datos de conexión**

| Campo | Valor |
|-------|--------|
| Usuario | `jpix_user` |
| Contraseña | `admin123` |
| Base de datos | `jpix_db` |
| Puerto | `5432` |

---

## ⚙️ Configuración del entorno (.env)

Cada integrante debe tener su propio archivo `.env` dentro de `jpix-backend/`:

```bash
NODE_ENV=development
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=jpix_user
DB_PASS=admin123
DB_NAME=jpix_db
DB_DIALECT=postgres
```

⚠️ El `.env` **no se sube** al repositorio.  
Solo se sube `.env.example` sin la contraseña real.

---

## 🧩 Configuración de Sequelize

**config/config.js**
```js
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'jpix_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres'
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME_TEST || 'jpix_db_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres'
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT
  }
};
```

**.sequelizerc**
```js
const path = require('path');

module.exports = {
  'config': path.resolve('config', 'config.js'),
  'models-path': path.resolve('src', 'models'),
  'seeders-path': path.resolve('src', 'seeders'),
  'migrations-path': path.resolve('src', 'migrations')
};
```

---

## 📦 Instalación de dependencias

```bash
cd jpix-backend
npm install
npm install sequelize pg pg-hstore
npm install --save-dev sequelize-cli dotenv
```

---

## 🧠 Crear base y verificar conexión

```bash
npx sequelize-cli db:create
```

**Posibles mensajes:**  
✅ `Database jpix_db created.` → conexión correcta.  
⚠️ `la base de datos «jpix_db» ya existe` → también correcto.

---

## 🧱 Migraciones (estructura de tablas)

**Crear migración**
```bash
npx sequelize-cli migration:generate --name create-usuarios
```

**Ejemplo (`src/migrations/XXXX-create-usuarios.js`)**
```js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      nombre: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      rol: { type: Sequelize.ENUM('admin', 'estudiante'), defaultValue: 'estudiante' },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('usuarios');
  }
};
```

**Aplicar migraciones**
```bash
npx sequelize-cli db:migrate
```

---

## 🌱 Seeders (datos de ejemplo)

**Crear seeder**
```bash
npx sequelize-cli seed:generate --name demo-usuarios
```

**Ejemplo (`src/seeders/XXXX-demo-usuarios.js`)**
```js
'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('usuarios', [
      { nombre: 'Administrador', email: 'admin@jpix.cl', rol: 'admin', createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Estudiante Prueba', email: 'estudiante@jpix.cl', rol: 'estudiante', createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', null, {});
  }
};
```

**Ejecutar seeders**
```bash
npx sequelize-cli db:seed:all
```

---

## 🧰 Comandos útiles

| Acción | Comando |
|--------|----------|
| Crear base | `npx sequelize-cli db:create` |
| Ejecutar migraciones | `npx sequelize-cli db:migrate` |
| Insertar datos iniciales | `npx sequelize-cli db:seed:all` |
| Revertir última migración | `npx sequelize-cli db:migrate:undo` |
| Borrar todos los datos de seeders | `npx sequelize-cli db:seed:undo:all` |

---

## 🧠 Errores comunes

| Mensaje | Causa | Solución |
|----------|--------|----------|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL no está encendido | Iniciar el servicio desde `services.msc` |
| `password authentication failed` | Contraseña incorrecta | Verificar `.env` y usuario de PostgreSQL |
| `client password must be a string` | `DB_PASS` vacío o mal definido | Revisar `.env` |
| `database jpix_db already exists` | Base ya creada | No es error, continuar con migraciones |
| `relation "usuarios" does not exist` | No se aplicaron migraciones | Ejecutar `db:migrate` |

---

## 👥 Instrucciones para cada integrante del grupo

1. Instalar PostgreSQL localmente.  
2. Crear usuario y base (`jpix_user`, `jpix_db`).  
3. Crear archivo `.env` (copiar de `.env.example` y completar).  
4. Ejecutar los siguientes comandos:

```bash
npm install
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev
```

**Probar API en Postman:**
```bash
GET http://localhost:3000/api/v1/usuarios
```

---

## 📝 Commit sugerido

```bash
git add .
git commit -m "feat(backend): configuración PostgreSQL + Sequelize con migraciones y seeders (EP 2.2)"
git push
```

**Opcional:**

```bash
git tag ep-2.2
git push --tags
```

---

## 🏁 Resultado final esperado

✅ Base de datos `jpix_db` creada localmente en cada PC  
✅ Usuario `jpix_user` con permisos  
✅ Conexión PostgreSQL + Sequelize funcionando  
✅ Migraciones y seeders aplicados  
✅ Listo para avanzar al **EP 2.3 (endpoints CRUD)**

# 📦 Estructura del Monorepo — JPIX

```
JPIX-PROYECTO/
├─ Jpix/                 # Frontend (Ionic + Angular)
└─ jpix-backend/         # Backend (Node + Express + PostgreSQL)
   ├─ .sequelizerc
   ├─ config/
   │  └─ config.js
   ├─ data/              # CSVs limpios (pegarlos aquí)
   │  ├─ asignaturas_obligatorias_limpias.csv
   │  ├─ asignaturas_fofu_limpias.csv
   │  ├─ secciones.csv
   │  ├─ secciones_fofu.csv
   │  ├─ bloques_horario.csv
   │  ├─ bloques_horario_fofu.csv
   │  └─ prerequisitos_obligatorias.csv
   ├─ src/
   │  ├─ server.js
   │  ├─ app.js
   │  ├─ config/
   │  │  └─ env.js
   │  ├─ middlewares/
   │  │  └─ error.middleware.js
   │  ├─ models/
   │  │  ├─ index.js              # loader a prueba de balas (factory functions)
   │  │  ├─ usuario.js
   │  │  ├─ asignatura.js
   │  │  ├─ seccion.js
   │  │  ├─ bloquehorario.js
   │  │  └─ requisito.js
   │  ├─ migrations/
   │  │  ├─ ... (usuarios si ya existía)
   │  │  └─ 20251013-init-schema.js
   │  ├─ seeders/
   │  │  ├─ 20251010013742-demo-usuarios.js
   │  │  ├─ 20251013-01-seed-asignaturas.js
   │  │  ├─ 20251013-02-seed-secciones.js
   │  │  ├─ 20251013-03-seed-bloques.js
   │  │  └─ 20251013-04-seed-requisitos.js
   │  └─ routes/
   │     └─ v1/
   │        ├─ health.routes.js
   │        ├─ users.routes.js
   │        └─ asignaturas.routes.js   # (opcional pero recomendado)
   └─ package.json
```

## ✅ Requisitos
- Node.js 18+ y npm
- PostgreSQL corriendo en local (puerto 5432 por defecto)
- (Opcional) Postman o curl

## 🔧 Instalación rápida
```bash
cd jpix-backend
npm i
npm i express cors morgan
npm i sequelize pg pg-hstore
npm i -D sequelize-cli dotenv nodemon
npm i bcryptjs csv-parse
```

## ⚙️ PostgreSQL (una vez)
```sql
CREATE ROLE jpix_user WITH LOGIN PASSWORD 'admin123';
ALTER ROLE jpix_user CREATEDB;
CREATE DATABASE jpix_db OWNER jpix_user;
GRANT ALL PRIVILEGES ON DATABASE jpix_db TO jpix_user;
```

## 🔐 .env en jpix-backend/
```bash
NODE_ENV=development
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=jpix_user
DB_PASS=admin123
DB_NAME=jpix_db
DB_DIALECT=postgres
# DB_SSL=true    # solo si tu proveedor prod lo pide
```

No comitear .env. Dejar un .env.example sin secretos.

## 🧭 Configuración Sequelize
**.sequelizerc**
```js
const path = require('path');

module.exports = {
  'config': path.resolve('config', 'config.js'),
  'models-path': path.resolve('src', 'models'),
  'seeders-path': path.resolve('src', 'seeders'),
  'migrations-path': path.resolve('src', 'migrations')
};
```

**config/config.js**
```js
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'jpix_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME_TEST || 'jpix_db_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    logging: false,
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: { require: true, rejectUnauthorized: false }
    } : {}
  }
};
```

## 🧠 Modelos (Sequelize)
Usuario → tabla usuarios (campos: rut, nombre, email único, password_hash, rol ENUM)
Asignatura → asignaturas (obligatorias/fofu/etc.)
Seccion → secciones (FK a asignaturas)
BloqueHorario → bloques_horario (FK a secciones)
Requisito → requisitos (self-join de asignaturas)
El loader src/models/index.js ignora archivos que no sean factory function, evitando crashes.

## 🧱 Migraciones
Tu migración de usuarios (ya existente).
Nueva migración académica: 20251013-init-schema.js
Crea asignaturas, secciones, bloques_horario, requisitos.
Índices y constraints (FKs, uniques).
Usa ENUMs para tipo, semestralidad, dia, actividad, paridad.

Si alguna vez tienes conflictos por tipos ENUM al hacer rollback/re-run, la migración down intenta dropear esos tipos. Si persiste, te paso versión con STRING.

## 🌱 Seeders
20251010013742-demo-usuarios.js
Inserta dos usuarios demo con bcryptjs → respeta rut y password_hash NOT NULL.
20251013-01-seed-asignaturas.js → Lee CSV asignaturas_obligatorias_limpias.csv y asignaturas_fofu_limpias.csv.
20251013-02-seed-secciones.js → Lee secciones.csv y secciones_fofu.csv y enlaza por sigla.
20251013-03-seed-bloques.js → Lee bloques_horario.csv y bloques_horario_fofu.csv y enlaza por (sigla,seccion).
20251013-04-seed-requisitos.js → Lee prerequisitos_obligatorias.csv y enlaza por sigla.

CSV esperados (en jpix-backend/data/):
asignaturas_obligatorias_limpias.csv, asignaturas_fofu_limpias.csv,
secciones.csv, secciones_fofu.csv,
bloques_horario.csv, bloques_horario_fofu.csv,
prerequisitos_obligatorias.csv.

## 🛣️ Rutas Express
Health
GET /api/v1/health → { "status": "ok" }

Usuarios (src/routes/v1/users.routes.js + src/controllers/users.controller.js)
GET /api/v1/usuarios
GET /api/v1/usuarios/:id
POST /api/v1/usuarios
PUT /api/v1/usuarios/:id
DELETE /api/v1/usuarios/:id

Asignaturas (opcional pero incluido)
GET /api/v1/asignaturas
GET /api/v1/asignaturas/:sigla (incluye secciones y bloques)

## 🏃 Scripts en package.json
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "db:create": "sequelize-cli db:create",
    "db:migrate": "sequelize-cli db:migrate",
    "db:seed": "sequelize-cli db:seed:all",
    "db:reset": "sequelize-cli db:seed:undo:all && sequelize-cli db:migrate:undo:all && sequelize-cli db:migrate && sequelize-cli db:seed:all"
  }
}
```

## 🚀 Cómo correr todo
CSV: pega los 7 CSV en jpix-backend/data/
DB:
```bash
npm run db:create
npm run db:migrate
npm run db:seed
```
Servidor:
```bash
npm run dev
```
Deberías ver: Jpix API escuchando en http://localhost:3000

## 🧪 Smoke tests (curl)
```bash
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/usuarios
curl http://localhost:3000/api/v1/usuarios/1
curl -X POST http://localhost:3000/api/v1/usuarios -H "Content-Type: application/json" -d '{"rut":"12345678-9","nombre":"Nuevo","email":"nuevo@jpix.cl","password":"secreto","rol":"estudiante"}'
curl http://localhost:3000/api/v1/asignaturas
curl http://localhost:3000/api/v1/asignaturas/INFXXXX
```

## 🧰 Troubleshooting (errores reales que vimos)
404 GET /api/v1/healt → Typo: es /api/v1/health.
el valor nulo en la columna rut/password_hash → Usa bcryptjs y rut en seeder.
Class constructor model cannot be invoked without 'new' → Loader seguro en models/index.js.
app.use() requires a middleware function → Revisa exports de routers.
ENUM rollback → Si persiste error, cambia ENUM a STRING.

## 🧭 Decisiones de diseño
CSV → Seeders: cargamos datos limpios directo a PostgreSQL.
Migraciones académicas separadas.
FKs con ON DELETE CASCADE.
Prerrequisitos: self-join.
Rutas CRUD + asignaturas consulta rápida.

## ▶️ Próximos pasos (EP 2.3+)
CRUD completo /asignaturas, /secciones, /bloques.
Tabla docentes + FK en secciones.
Endpoint /horarios/propuesta (sin choques).
Autenticación JWT (roles).
Tests Jest/Supertest.

# JPIX — EP 2.3 · API REST básica (Backend listo y probado)

Este README resume **lo implementado y probado en el Punto 2.3** del proyecto **Jpix**: API REST con **Express + Sequelize + PostgreSQL**, modelos, migraciones, seeders, rutas y pruebas con **Insomnia**.

> **Tip:** Este backend queda preparado para continuar con **EP 2.4** (consumo desde Ionic con `HttpClient`) sin reordenar nada.

---

## 📦 Estructura del repo (monorepo)

```
JPIX-PROYECTO/
├─ Jpix/                 # Frontend (Ionic + Angular)
└─ jpix-backend/         # Backend (Node + Express + PostgreSQL)
   ├─ .sequelizerc
   ├─ config/
   │  └─ config.js
   ├─ src/
   │  ├─ server.js
   │  ├─ app.js
   │  ├─ config/
   │  │  └─ env.js
   │  ├─ middlewares/
   │  │  └─ error.middleware.js
   │  ├─ models/
   │  │  ├─ usuario.js
   │  │  ├─ asignatura.js
   │  │  ├─ seccion.js
   │  │  ├─ bloquehorario.js
   │  │  └─ requisito.js
   │  ├─ migrations/
   │  │  ├─ (usuarios, asignaturas, secciones, bloques_horario, requisitos)
   │  ├─ seeders/
   │  │  ├─ 20251010013742-demo-usuarios.js
   │  │  ├─ 20251013-01-seed-asignaturas.js
   │  │  ├─ 20251013-02-seed-secciones.js
   │  │  ├─ 20251013-03-seed-bloques.js
   │  │  └─ 20251013-04-seed-requisitos.js
   │  └─ routes/
   │     └─ v1/
   │        ├─ health.routes.js
   │        ├─ users.routes.js
   │        ├─ asignaturas.routes.js
   │        ├─ secciones.routes.js
   │        ├─ bloques.routes.js
   │        └─ requisitos.routes.js
   └─ package.json
```

---

## ✅ Requisitos

- **Node.js 18+** y npm
- **PostgreSQL** (puerto 5432)
- **Insomnia** o Postman para pruebas

---

## 🔐 Variables de entorno (`.env` en `jpix-backend/`)

```
NODE_ENV=development
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=jpix_user
DB_PASS=admin123
DB_NAME=jpix_db
DB_DIALECT=postgres
```

> No subir `.env` al repo. Mantener un `.env.example`.

---

## 🧰 Instalación y scripts

```bash
# instalar deps
npm i
# deps clave
npm i express cors morgan
npm i sequelize pg pg-hstore
npm i bcryptjs csv-parse
npm i -D sequelize-cli dotenv nodemon

# scripts (package.json)
#  "dev": "nodemon src/server.js"
#  "db:create": "sequelize-cli db:create"
#  "db:migrate": "sequelize-cli db:migrate"
#  "db:seed": "sequelize-cli db:seed:all"
#  "db:reset": "sequelize-cli db:seed:undo:all && sequelize-cli db:migrate:undo:all && sequelize-cli db:migrate && sequelize-cli db:seed:all"
```

---

## 🧱 Modelos (resumen de campos y relaciones)

- **Usuario** (`usuarios`): `rut` (unique), `nombre`, `email` (unique), `password_hash`, `rol` (`admin|estudiante`).
- **Asignatura** (`asignaturas`): `sigla` (unique), `nombre`, `tipo` (`obligatoria|fofu|ingles|optativa`), `creditos`, `periodo_malla`, `semestralidad` (`ANUAL|SEMESTRAL`), `tasa_aprobacion`, `tasa_aprobacion_pct`.
  - Relaciones: `Asignatura.hasMany(Seccion, { as: 'secciones' })` y **self-join** vía `Requisito` (`belongsToMany`).
- **Seccion** (`secciones`): `asignatura_id` (FK), `seccion`, `nombre`, `codigo_completo`, `docente`.
  - Relaciones: `belongsTo(Asignatura)` y `hasMany(BloqueHorario, { as: 'bloques' })`.
- **BloqueHorario** (`bloques_horario`): `seccion_id` (FK), `dia` (`LUN|MAR|MIE|JUE|VIE|SAB`), `clave_ini`, `clave_fin`, `actividad` (`CAT|TAL|AY`), `sede`, `sala`, `paridad` (`PAR|IMPAR|AMBOS`), `hora_inicio`, `hora_fin`.
  - Relaciones: `belongsTo(Seccion)`.
- **Requisito** (`requisitos`): `asignatura_id` (FK a asignaturas), `requiere_id` (FK a asignaturas).

> Las migraciones respetan el orden de dependencias: **asignaturas → secciones → bloques_horario → requisitos**.

---

## 🧪 Migraciones y seeders

```bash
npm run db:create
npm run db:migrate
npm run db:seed
```

### Semillas idempotentes (recomendado)
Para evitar errores de duplicados (ej. `usuarios_rut_key`), el seeder `demo-usuarios` borra los RUT a insertar antes de `bulkInsert`. Alternativa: *upsert* con `updateOnDuplicate` (no estándar en `queryInterface`).

### Reset en dev
Si `db:reset` falla por dependencias (FKs), soluciones:
- **Down con CASCADE** en `dropTable('secciones', { cascade: true })`, o
- Deshacer primero `bloques_horario` y luego `secciones`, o
- `DROP TABLE "bloques_horario" CASCADE;` (solo dev).

---

## 🚀 Levantar servidor

```bash
npm run dev
# http://localhost:3000
```

Healthcheck:
```
GET /api/v1/health  →  { "status": "ok" }
```

---

## 🌐 Endpoints (EP 2.3)

### Usuarios
```
GET    /api/v1/usuarios
GET    /api/v1/usuarios/:id
POST   /api/v1/usuarios
PUT    /api/v1/usuarios/:id
DELETE /api/v1/usuarios/:id
```
**POST /api/v1/usuarios (JSON):**
```json
{
  "rut":"12345678-9",
  "nombre":"Nuevo",
  "email":"nuevo@jpix.cl",
  "password":"secreto",
  "rol":"estudiante"
}
```

---

### Asignaturas
```
GET  /api/v1/asignaturas
GET  /api/v1/asignaturas/:sigla   # incluye secciones y bloques
```
**Ejemplo:**
```
GET /api/v1/asignaturas/INF1211
→ { "data": { "sigla":"INF1211", "nombre":"...", "secciones":[{ "bloques":[...] }] } }
```

---

### Secciones
```
GET  /api/v1/secciones
GET  /api/v1/secciones/:id
```
> (CRUD completo opcional; hoy se exponen consultas de lectura para apoyar la vista y depuración)

---

### Bloques Horario
```
GET  /api/v1/bloques
GET  /api/v1/bloques/:id
```

---

### Requisitos
```
GET  /api/v1/requisitos
GET  /api/v1/requisitos/:id
```

---

## 🧪 Guía de pruebas con **Insomnia**

1. **Crear entorno** con variable `base_url = http://localhost:3000/api/v1`.
2. **Colección** “Jpix / v1” con requests:
   - `GET {{ base_url }}/health`
   - `GET {{ base_url }}/usuarios`
   - `POST {{ base_url }}/usuarios` (body JSON del ejemplo)
   - `PUT {{ base_url }}/usuarios/:id` (cambiar `nombre`, `email` o `password` → se hashea)
   - `DELETE {{ base_url }}/usuarios/:id`
   - `GET {{ base_url }}/asignaturas`
   - `GET {{ base_url }}/asignaturas/INF1211`
   - `GET {{ base_url }}/secciones`
   - `GET {{ base_url }}/secciones/1`
   - `GET {{ base_url }}/bloques`
   - `GET {{ base_url }}/bloques/1`
   - `GET {{ base_url }}/requisitos`
   - `GET {{ base_url }}/requisitos/1`
3. Verificar respuestas `200/201/204` y formato `{ "data": ... }` o `{ "error": { message, code } }`.

---

## 🛡️ Manejo de errores y formato de respuesta

- **OK** → `{ "data": ... }`
- **Error** → `{ "error": { "message": "...", "code": 400|401|403|404|409|500 } }`
- Middleware global: `errorHandler`, 404 genérico y `favicon.ico` silencioso.

---

## 🔜 Preparado para EP 2.4 (no implementado aquí)

- Front **Ionic** consumirá esta API con `HttpClient`.
- Configurar `environment.ts`: `API_URL = 'http://localhost:3000/api/v1'`.
- Servicios recomendados: `AsignaturasService`, `UsuariosService`, etc.

---

## 🧩 Troubleshooting real

- **"llave duplicada viola restricción de unicidad 'usuarios_rut_key'"**
  - Solución: `seed:undo` del seeder, o seeder idempotente (delete+insert), o `db:reset`.
- **"no existe la relación «asignaturas»"**
  - Causa: migraciones no aplicadas / orden incorrecto.
  - Solución: `npx sequelize-cli db:migrate`, verificar con `\dt` en psql.
- **Undo con FKs (secciones/bloques)**
  - Solución: `dropTable('secciones', { cascade: true })` en `down`, o deshacer en orden.

---

## ✅ Estado EP 2.3

- ✅ Backend Express operativo con prefijo **`/api/v1`**
- ✅ Modelos Sequelize y relaciones
- ✅ Migraciones y seeders aplicados
- ✅ Endpoints listos y probados con **Insomnia**
- 🚧 Listo para **EP 2.4** (consumo desde Ionic)

---

Hecho con ❤️ para Jpix.