# Entrega Parcial 2: Backend e Integración 
## 1. Introducción

El proyecto JPIX como se mencionó en la entrega anterior tiene como propósito desarrollar una plataforma web y móvil orientada a la gestión académica de los estudiantes, brindando una herramienta moderna que permita visualizar, consultar y administrar asignaturas, secciones y horarios.

En esta nueva entrega, el enfoque principal se centró en el desarrollo del backend, creando una base sólida que permita la futura expansión del sistema, garantizando seguridad, modularidad y comunicación efectiva con el frontend.

## 2. Objetivo del Backend

El objetivo fundamental de esta entrega fue levantar una API RESTful funcional utilizando Node.js y Express, capaz de conectarse a una base de datos relacional en PostgreSQL.
Se implementó un sistema de autenticación con JSON Web Tokens (JWT) para validar usuarios y roles, junto con un esquema de rutas protegidas que asegura el control de acceso entre administradores y estudiantes.
Además, se estableció la conexión con el frontend desarrollado en Ionic/Angular, posibilitando la interacción entre ambos entornos.

## 3. Tecnologías Utilizadas

* **Backend**: Node.js con Express, Sequelize y PostgreSQL.
* **Frontend**: Ionic + Angular (TypeScript, HTML y SCSS).
* **Autenticación**: JSON Web Tokens (JWT) y bcryptjs.
* **Pruebas y depuración**: Insomnia para validación de endpoints.
* **Entorno**: Variables configuradas con .env y control de versiones mediante Git.

## 4. Backend
En esta sección se detalla la estructura, configuración e implementación del backend del proyecto JPIX, abarcando la organización de archivos, la definición de rutas principales, el diseño del modelo de base de datos y la lógica que permite el funcionamiento general del servidor.

### 4.1 Estructura
El backend se desarrolló bajo una arquitectura modular en el directorio jpix-backend/, para permitir escalabilidad y mantenimiento sencillo.

``` 
jpix-backend/
├─ src/
│  ├─ server.js
│  ├─ app.js
│  ├─ config/
│  │  └─ env.js
│  ├─ middlewares/
│  │  └─ error.middleware.js
│  ├─ models/
│  ├─ migrations/
│  ├─ seeders/
│  └─ routes/v1/
│     ├─ health.routes.js
│     ├─ users.routes.js
│     └─ asignaturas.routes.js
└─ package.json 
```

Esta estructura separa claramente la lógica del servidor, la configuración del entorno, los modelos de datos, los controladores y las rutas, siguiendo el patrón MVC (Modelo–Vista–Controlador) adaptado al contexto de una API.

### 4.2 Configuración del servidor
El servidor se construyó utilizando Express, incorporando middlewares globales como CORS para habilitar solicitudes desde el frontend, MORGAN para registrar peticiones y un middleware para manejar errores.

- **server.js**
    ```
    const { app } = require('./app');
    const { PORT } = require('./config/env');

    app.listen(PORT, () => {
    console.log(`Jpix API escuchando en http://localhost:${PORT}`);
    });
    ```
    Este archivo inicializa el servidor y lo pone en escucha sobre el puerto definido en las variables de entorno.

- **app.js**
    ```
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
    app.use(errorHandler);
    module.exports = { app };
    ```
    En este fragmento se definen los middlewares básicos y las rutas principales, asegurando que cada petición sea procesada correctamente y que los errores sean capturados por el errorHandler.

- **error.middleware.js**
    ```
    exports.errorHandler = (err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({
        error: { message: err.message || 'Error interno', code: err.status || 500 }
        });
    };
    ```
    Este middleware centraliza el manejo de errores, garantizando respuestas uniformes en caso de fallas del servidor o excepciones no controladas.

### 4.3 Endpoints Principales
Para garantizar la evolución del sistema definimos las rutas como /api/v1/. Esta versión nos permite introducir cambios y nuevas capacidades de forma controlada, manteniendo operativas las integraciones actuales.

Los endpoints se diseñaron con criterios RESTful, definiendo recursos claros, métodos HTTP coherentes y respuestas consistentes. De este modo, el frontend puede consumir la información de manera predecible y el backend permanece modular y fácil de mantener.

**Endpoints:**

- **GET (/api/v1/health)**: Verifica el estado del servidor
- **GET (/api/v1/asignaturas)**: Lista todas las asignaturas registradas
- **GET (/api/v1/asignaturas/:sigla)**: Muestra los detalles de una asignatura específica con sus secciones y bloques

### 4.4 Base de datos
La base de datos fue implementada con PostgreSQL, gestionada mediante Sequelize ORM, lo que permite definir modelos en JavaScript y traducirlos automáticamente a tablas SQL.

Se crearon migraciones y seeders para construir la estructura de las siguientes entidades:

* **Usuarios**: contiene datos personales, credenciales y rol.
* **Asignaturas**: detalla la información de las materias.
* **Secciones**: asocia cada asignatura a un número de sección y su docente.
* **Bloques Horarios**: almacena los horarios específicos de cada sección.
* **Requisitos**: define relaciones de prerequisitos entre asignaturas.

## 5. Autenticación y Manejo de Usuarios
La autenticación es una parte esencial del backend, ya que define quién puede acceder a cada recurso. Para este proyecto se utilizó un sistema basado en JWT que permite validar la identidad de los usuarios y controlar el acceso según su rol.

### 5.1 Implementación de JWT
El implementar JWT a nuestro sistema garantiza que cada solicitud al servidor esté asociada a una sesión válida y a un usuario autenticado. Este mecanismo posibilita distinguir entre distintos roles, como administrador y estudiante, limitando las acciones que cada uno puede realizar dentro del sistema.

El proceso abarca desde el registro e inicio de sesión hasta la validación continua del token en cada petición protegida, manteniendo la seguridad sin necesidad de almacenar sesiones en el servidor.

**Ejemplo de rutas:**
* **POST (/api/v1/auth/register)**: Crea un nuevo usuario y devuelve un token.
* **POST (/api/v1/auth/login)**: Autentica a un usuario existente y genera un token.
* **GET (/api/v1/auth/me)**: Devuelve la identidad del usuario validando su token.

El backend utiliza bcryptjs para encriptar las contraseñas y jsonwebtoken para la generación y verificación de los tokens. Además, las rutas protegidas implementan un middleware de autenticación que comprueba la validez del token antes de permitir el acceso, para aspi tener un flujo seguro y controlado dentro de la API.

## 6. Validación y manejo de sesiones
En esta etapa del proyecto, se implementó un sistema basado en tokens JWT, lo que permite identificar a los usuarios autenticados sin necesidad de mantener sesiones activas en el servidor. Este enfoque proporciona una gestión ligera, eficiente y escalable de las sesiones, manteniendo la persistencia del acceso del usuario mientras conserva la integridad y confidencialidad de los datos.

**Guards implementados:**
- **AuthGuard**: permite el acceso solo si existe un token.
- **AdminGuard**: restringe rutas administrativas exclusivamente al rol “admin”.

Estos guards aseguran que las vistas y componentes visibles se adapten dinámicamente al rol del usuario, evitando accesos indebidos y mejorando la seguridad general del sistema.

## 7. Integración Frontend-Backend
Una vez implementado y probado el backend, se estableció la comunicación con el frontend mediante HttpClient en Angular.
Esta conexión permite que las páginas de login, catálogo de asignaturas y administración de usuarios interactúen directamente con los endpoints del servidor.

* **environment.ts**
    ```
    export const environment = {
        production: false,
        API_URL: 'http://localhost:3000/api/v1'
    };
    ```
    Definición de URL base de la API, utilizada por los servicios del frontend.

* **AuthService**
    ```
    loginWithCredentials({ email, password }) {
        return this.http.post(`${environment.API_URL}/auth/login`, { email, password });
    }
    ```
    Este servicio envía las credenciales del usuario al backend y, al recibir un token, lo guarda localmente para futuras peticiones.

## 8. Uso de Insomnia
Durante el proceso de verificación del backend, se realizaron diversas pruebas utilizando Insomnia para comprobar el correcto funcionamiento de la API, la autenticación con JWT y las rutas protegidas.

Las siguientes pruebas permitieron verificar tanto las rutas públicas como las privadas, además de confirmar que la autenticación y los permisos por rol funcionaran correctamente.

* **GET /health**: Comprueba el estado del servidor y la conexión de la API.
* **GET /usuario**: Listado de todos los usuarios (requiere rol de administrador).
* **POST /usuarios**: Crea un nuevo usuario en el sistema.
* **GET /usuarios/:id**: Obtiene la información de un usuario por su ID.
* **PUT /usuarios/:id**: Actualiza los datos de un usuario específico.
* **DELETE /usuarios/:id**: Elimina un usuario según su ID (solo accesible por administrador).
* **POST /login**: Inicia sesión y devuelve el token de autenticación.
* **GET /usuarios2**: Ruta de prueba adicional para consulta de usuarios.
* **GET /usuarioYo**: Devuelve la información del usuario autenticado.

**IMPORTANTE**: En el archivo "PruebaInsomnia" se encuentran todos los resultados obtenidos al momento de ejecutar los métodos HTTP mencionados anteriormente. 

## 9. Conclusión
El desarrollo del backend de JPIX representó un avance significativo en la estructura, logrando establecer una API REST estable y segura, funcional, capaz de conectarse con una base de datos relacional y comunicarse eficazmente con el frontend.

La integración de JWT permitió un sistema de autenticación robusto y escalable, garantizando que cada usuario interactúe dentro de los límites de su rol.

Este nuevo avance del proyecto nos permitió sentar las bases para futuras expansiones, como la gestión personalizada del perfil académico de cada estudiante, la creación de un sistema de recomendación de horarios, y la incorporación de un asistente conversacional más inteligente dentro del frontend.