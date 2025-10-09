# Jpix — Backend (EP 2.1)

**Objetivo del hito:** levantar el backend base con **Node.js + Express**, listo para crecer en EP 2.2–2.6 sin reordenar nada.  
Incluye middlewares, versionado de API y un **healthcheck**.

## 📦 Estructura del repo (monorepo)
```
JPIX-PROYECTO/
├─ Jpix/           # Frontend (Ionic + Angular)
└─ jpix-backend/   # Backend (Node + Express)  ← este README
```

> Si aún no es monorepo, moveremos el `.git` a la raíz más adelante. Por ahora, este README cubre el backend.

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
