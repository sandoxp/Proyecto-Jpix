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

