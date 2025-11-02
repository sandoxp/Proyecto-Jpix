# **JPIX: Tu asistente virtual que te ayuda a organizar tu vida universitaria**

**Integrantes**: Isidora Gárate, Matías Pardo, Sebastián Sandoval y Joaquín Saldivia.
## Propósito de JPIX
JPIX es una plataforma web y móvil orientada a optimizar la gestión académica de los estudiantes, permitiendo consultar, organizar y administrar de manera intuitiva asignaturas, horarios y requisitos de cada carrera.

El proyecto busca ofrecer una herramienta centralizada que facilite la planificación del semestre, entregando información clara sobre los cursos disponibles y evitando conflictos de horario.

En su fase actual, JPIX está enfocado principalmente en los estudiantes de Ingeniería Informática, quienes podrán utilizarlo para organizar su carga académica y visualizar sus posibles combinaciones de asignaturas.

**Secciones de la página**
- Registro e Inicio de sesión
- Página principal para consultas específicas
- Menú:
    * Inicio
    * Catálogo
    * Horario
    * Progreso
    * Perfil

## Estructura del Proyecto
El repositorio de JPIX está organizado en dos carpetas principales, que separan el desarrollo del frontend y el backend, permitiendo una estructura más limpia, escalable y fácil de mantener y comprender.

* **Jpix**: Corresponde al frontend del proyecto, desarrollado con Ionic y Angular. En esta carpeta se encuentran las vistas, componentes, servicios y módulos que conforman la interfaz de usuario.
Desde aquí se gestiona la navegación, el consumo de la API REST y la interacción directa con los estudiantes y/o administradores.

* **Jpix-backend**: Contiene el backend del sistema, implementado con Node.js, Express y PostgreSQL. Aquí se incluye toda la lógica del servidor, configuración de base de datos mediante Sequelize ORM, controladores, middlewares y rutas de la API.

    Esta capa se encarga de manejar la autenticación, el control de roles, la comunicación con la base de datos y el envío de información al frontend.

## Tecnologías utilizadas
### **Frontend**
El frontend fue desarrollado utilizando Ionic Framework junto con Angular, permitiendo construir una interfaz moderna, adaptable y compatible tanto con navegadores web como con dispositivos móviles.

* **Ionic Framework**: facilita el desarrollo multiplataforma con componentes visuales responsivos.

* **Angular**: estructura la aplicación con un modelo basado en componentes, servicios y módulos.

* **TypeScript**: lenguaje principal del frontend, que mejora la legibilidad y el control del código.

* **HTML5 y SCSS**: usados para el diseño visual de las páginas.

* **HttpClient (Angular)**: permite la comunicación con la API del backend para el envío y recepción de datos.

### **Backend**
El backend se construyó sobre Node.js y Express, implementando una arquitectura RESTful conectada a una base de datos relacional en PostgreSQL.

* **Node.js**: entorno de ejecución que permite manejar peticiones de manera eficiente.

* **Express**: framework que facilita la creación de rutas, middlewares y controladores.

* **Sequelize ORM**: se encarga de la conexión con la base de datos PostgreSQL y del manejo de modelos, migraciones y seeders.

* **PostgreSQL**: sistema de gestión de base de datos relacional que almacena la información académica y de usuarios.

* **bcryptjs**: utilizado para encriptar contraseñas antes de almacenarlas.

* **JSON Web Token (JWT)**: encargado de la generación y validación de tokens de autenticación.

* **Morgan y Cors**: registran las solicitudes y habilitan la comunicación entre dominios.

### **Herramientas de prueba**
* **Insomnia**: probar y validar los endpoints del backend.
* **pgAdmin 4**: herramienta visual para la gestión de la base de datos PostgreSQL.

## Instalación y ejecución del Proyecto
1. Clonar el repositorio desde GitHub
    
    Abra una terminal y ejecute el siguiente comando para obtener el proyecto: git clone https://github.com/sandoxp/Proyecto-Jpix.git.

2. Crear una carpeta en su dispositivo para poder ejecutar el proyecto dentro de VisualStudio.

3. Acceder al proyecto clonado en la terminal con el comando "cd nombre-carpeta".

4. El repositorio contiene 2 carpetas, jpix y jpix-backend.

5. **Ejecución de Frontend**: En la primera terminal debe de acceder a la carpeta del frontend e instalar las dependencias.
    * Acceder al Frontend: cd Jpix
    * Paquetes Ionic: npm install
    * Ejecución de página: ionic serve

6. **Ejecución de Backend**: En una segunda terminal, debe de:
    * Acceder al Backend: cd Jpix-backend
    * Paquetes Ionic: npm install
    * Base de datos: npm run db:reset
    * Ejecución de peticiones: npm run dev

7. Debe de mantener las dos terminales abiertas (Frontend y Backend).

8. Al momento de iniciar la aplicación, debe de registrarse en la página para poder utilizar las funcionalidades de esta.

9. Para terminar la ejecución del programa debe de ejecutar el comando "Ctrl C" para ambas terminales.
