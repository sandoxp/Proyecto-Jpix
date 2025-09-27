# Proyecto-Jpix  
Asistente virtual académico para la preinscripción de asignaturas en la PUCV.  

# Presentado por:  
- Isidora Gárate Carrasco 
- Matias Pardo Rozas
- Joaquín Saldivia Osorio
- Sebastián Sandoval Velásquez

# Asistente Virtual Jpix  

## Índice  
1. [Resumen del Proyecto](#resumen-del-proyecto)  
2. [Requerimientos](#requerimientos)  
   - [Roles del Sistema](#roles-del-sistema)  
   - [Requerimientos Funcionales](#requerimientos-funcionales)  
   - [Requerimientos No Funcionales](#requerimientos-no-funcionales)  
3. [Arquitectura de la Información](#arquitectura-de-la-información)  
4. [Diseño de Prototipos](#diseño-de-prototipos)  
5. [Librerías en Angular](#librerías-usadas-con-angular)  
6. [Tecnologías](#tecnologías)  

---

## Resumen del Proyecto  

Jpix es un asistente virtual académico desarrollado para ayudar a los estudiantes de la PUCV en la preinscripción y organización de sus asignaturas. Este sistema está diseñado para facilitar la construcción de horarios académicos óptimos, teniendo en cuenta una serie de factores que afectan la inscripción de los estudiantes siendo algunos de estos:
- Asignaturas reprobadas y atrasadas de tipo obligatorias.  
- Créditos máximos según IRA (Índice de Riesgo Académico).  
- Asignaturas de Formación Fundamental (FOFU) e Inglés.  
- Choques de horario y traslados inviables entre sedes.  

Los estudiantes interactúan con el sistema a través de consultas en lenguaje natural, permitiendo organizar y generar su horario académico de forma automática o manual, asegurando que se cumplan las reglas académicas, los requisitos de asignaturas y evitando conflictos de horarios o traslados inviables entre sedes. Por su parte, los administradores son responsables de mantener el catálogo de asignaturas, sedes y salas, así como de definir las reglas académicas y los parámetros de funcionamiento del sistema, garantizando que el proceso de inscripción y organización de horarios sea eficiente, preciso y cumpla con todas las normativas de la universidad. Ambos roles trabajan en conjunto para optimizar la experiencia académica, asegurando que los estudiantes puedan tomar decisiones informadas mientras el administrador gestiona los aspectos estructurales del sistema.

Jpix está diseñado para mejorar la experiencia académica de los estudiantes, ayudándolos a tomar decisiones informadas sobre su carga académica y optimizar su tiempo entre clases, contribuyendo a la mejora de la experiencia educativa mediante la automatización de tareas complejas y la reducción de errores en el proceso de inscripción.

---

## Requerimientos  

### Roles del Sistema  
- **Estudiante**: consulta en lenguaje natural, explora catálogo y construye su horario.  
- **Administrador**: mantiene el catálogo y define reglas y parámetros del sistema.  

---

### Requerimientos Funcionales  

#### Rol Estudiante  
- **RF-EST-01: Consulta en lenguaje natural**  
  El estudiante escribe mensajes en un chat (“Organiza mi horario”, “Agrega Inglés II sección A”).  
  El sistema identifica una sola intención por mensaje y ejecuta la acción correspondiente o solicita aclaración si la intención es ambigua.  

- **RF-EST-02: Explorar catálogo de asignaturas**  
  El estudiante visualiza el catálogo con: código, nombre, sección, docente, sede, sala, bloques y créditos.  
  Puede filtrar por tipo, sede y día, y ordenar por código o nombre.  

- **RF-EST-03: Validación automática de reglas académicas**  
  El sistema valida, durante la construcción del horario: prerrequisitos, inclusión de reprobadas/atrasadas, cumplimiento de FOFU e Inglés, y límite de créditos según IRA.  

- **RF-EST-04: Detección de choques de horario**  
  El sistema detecta solapes de tiempo en un mismo día entre dos o más secciones y muestra un aviso con el conflicto identificado.  

- **RF-EST-05: Detección de traslados inviables**  
  El sistema evalúa si es posible trasladarse entre sedes en bloques consecutivos, usando una matriz de tiempos mínimos.  
  Si no es viable, se muestra una alerta indicando las sedes involucradas.  

- **RF-EST-06: Generación de propuestas de horario con preferencias**  
  El sistema genera propuestas de horario sin choques y cumpliendo reglas académicas.  
  Permite aplicar preferencias como “menos carga”, “evitar traslados”, “prefiero sede X” o “sin clases viernes”.  

#### Rol Administrador  
- **RF-ADM-01: Gestión de catálogo y parámetros**  
  El administrador crea, edita o elimina cursos, secciones, sedes y salas.  
  Además, configura reglas académicas (prerrequisitos, obligatoriedad de reprobadas/atrasadas, FOFU/Inglés, límite de créditos por IRA) y define la matriz de traslados.  

---

### Requerimientos No Funcionales  

- **RNF-01: Accesibilidad**  
  La interfaz cumple principios de accesibilidad: contraste adecuado, foco visible, navegación por teclado y uso de etiquetas ARIA en componentes interactivos.  

- **RNF-02: Usabilidad**  
  La interfaz es clara y coherente, con navegación simple, retroalimentación visual ante acciones, y uso de componentes Ionic (tabs, headers, modals, alerts, lists).  

- **RNF-03: Seguridad**  
  El sistema protege la información de los usuarios mediante autenticación con JWT, encriptación de contraseñas con bcrypt y configuración segura de CORS.  

- **RNF-04: Privacidad**  
  Los datos académicos se manejan con confidencialidad. En modo demo se utilizan datos ficticios; en producción se restringe la recopilación al mínimo necesario.  

- **RNF-05: Portabilidad y compatibilidad**  
  La aplicación funciona en navegadores modernos y se adapta a dispositivos móviles y de escritorio mediante diseño responsive.  

- **RNF-06: Disponibilidad (PWA)**  
  La aplicación es instalable como PWA y permite uso con conectividad limitada, mostrando el catálogo cacheado y el horario guardado.  

- **RNF-07: Mantenibilidad**  
  El código está modularizado y documentado, de modo que se puedan añadir nuevas reglas académicas o sedes sin afectar toda la aplicación.  

---



### Definición de la navegación y experiencia de usuario (UX)
---

### Objetivo
Diseñar una experiencia de usuario clara, eficiente y accesible, donde el estudiante interactúe con nuestro asistente virtual **Jpix** y pueda acceder a vistas gráficas (catálogo, calendario, alertas). La navegación debe permitir que los usuarios encuentren fácilmente lo que buscan, comprendan cómo moverse en la aplicación y completen sus tareas sin confusión.

---

### Flujo de Navegación (descripción textual)

> **Nota:** El diagrama se representará en Lucidchart, siguiendo los bloques de *Comienzo/Fin, Procesos, Mensajes, Base de datos y Preguntas de decisión*.

>**Link de diagrama de flujo**: https://lucid.app/lucidchart/dec4816f-a01b-418d-81e2-946b6cb97968/edit?viewport_loc=-8178%2C-2077%2C11258%2C5060%2C0_0&invitationId=inv_1613f2b7-671c-4d7a-b23e-de70bc6eaae9

1. **Inicio (Comienzo)**  
   - Pantalla de bienvenida en la cuál el usuario debe de seleccionar su rol para poder utilizar JPIX.  

2. **Selección de Rol**  
   - El usuario decide si entra como **Estudiante** o **Administrador**. En caso de que este no tenga cuenta se muestra la opción para registrarse.  

2.1. **Estudiante**  
   - ***Inicio de sesión inválida***
      - Aparece un mensaje indicando que se ingresaron los datos incorrectos y el sistema permitirá que el usuario reintente ingresar sus datos. 
   - ***Inicio de sesión válido***  
    - Dirige al usuario a la pantalla principal.  
    - Desde el chat se puede acceder a lo siguiente:  
      - **Menú**: Contiene las opciones para dirigir al usuario a las pestañas de "Inicio", "Catálogo", "Horario" y "Configuración".  
        - ***Inicio***: Dirige al usuario a la pantalla inicial de la página.
        - ***Catálogo***: Muestra el listado de asignaturas que estan disponibles con toda la información necesaria para inscribirlo y que van acorde al semestre que va cursando el estudiante.
        - ***Horario***: Muestra el último horario guardado con las asignaturas añadidas con su respectivo color para identificar si es una asignatura Obligatoria, Fofu, Inglés u Optativo. 
        - ***Configuración***: El usuario puede modificar la página según sus preferencias. 
      - **Perfil**: Botón para ver la información del usuario.  
      - **Escritura/Selección de consulta**: Barra de búsqueda para que el usuario elija o escriba lo que desee realizar en la página, sea organizar su horario, consultar ubicación de sedes, añadir asignaturas, etc.  
        - Para esta sección mostramos la creación de un horario consultando al usuario ***¿Cómo desea construir su horario?*** teniendo como opciones la generación manual y automática.
          - **Manual**: El usuario selecciona la opción de explorar por el ***Catálogo de cursos*** para poder ir eligiendo sus asignaturas correspondientes las cuales van agregandose al borrador de horario. Una vez añadidas las asignaturas al borrador, el sistema validará múltiples variables por las cuales cada asignatura deberá de pasar. 
            - **Choque detectado**: El sistema encuentra un choque de horario entre alguna asignatura e imprime un mensaje indicando esto mismo, redirigiendo al usuario al borrador para que así sea modificado posteriormente. 
            - **No existen choques**: Al no existir ningún choque ded horario, el sistema continua y ahora debe de validar que los traslados entre sedes sean viables para que el estudiante pueda asistir a sus clases en el área en que se encuentre.
            - **Traslado inviable**: El sistema imprime un mensaje indicando que el traslado a otra sede es inviable debido al tiempo disponible entre clases, indicando que el estudiante no llegaría a tiempo a su siguiente clase y posteriormente debe de elegir la misma asignatura, pero en una sede más cercana.
            - **Traslado viable**: El sistema considera la asignatura y se dirige a la siguiente validación para poder terminar el proceso de revisión.
            - **No cumple con las reglas académicas**: El sistema imprime un mensaje dependiendo de la falta que no cumple el usuario y lo dirige a modificar la asignatura en el borrador.
            - **Cumple con las reglas académicas**: Si cumple con esta última validación se muestra un mensaje indicando que la asignatura fue agregada exitosamente.
              - Una vez añadida la asignatura, el sistema da la opción de añadir otra asignatura al horario. En caso de que el usuario quisiera agregar otra asignatura se vuelve a realizar todo el proceso anterior nuevamente, pero si no se desea agregar otra asignaura se muestra el horario final dando por finalizado el proceso.
              
          - **Automático**: El usuario al elegir esta opción el sistema comienza a generar una propuesta de horario de forma automática mediante la información del usuario para ir añadiendo las asignaturas correspondientes al borrador del horario para que posteriormente pase por el proceso de validación de la asignatura.
            - **Choque detectado**: Al encontrar un choque con otra asignatura el sistema ajusta el horario volviendo al borrador del horario e imprimiendo un mensaje indicando el por qué tomo esa decisión.
            - **No existen choques**: El cumplir esta primera validación se pasa a la siguiente verificando si existe un traslado viable entre sedes.
            - **Traslado inviable**: En este caso, el usuario no puede dirigirse a otra sede debido a la distancia entre una con la otra y el tiempo disponible entre clases es muy corta, por esto el sistema ajusta el horario y muestra su respectiva explicación de la decision modificando el borrador del horario. 
            - **Taslado viable**: Cumpliendo esta validación pasa a la última, verificando que cumpla con las reglas académicas respectivas para poder añadir definitivamente la asignatura al horario.
            - **No cumple con las reglas académicas**: Si no se cumple con las reglas el sistema ajusta el horario en el borrador e imprime la explicación respectiva de la regla que no se cumplio.
            - **Cumple con las reglas académica**: El sistema genera un mensaje indicando que el horario fue generado existosamente cumpliendo con todas las verificaciones.
              - Una vez generado el horario el sistema da la opción de refinar la propuesta de horario para que sea más precisa y cómoda para el usuario. En caso que si quiera refinar la propuesta se realizará nuevamente todo el proceso que ya había realizado verificando si cumple con todas las variantes, pero si no se desea realizar una modificación, el sistema da por finalizado el proceso. 

2.2. **Administrador**  
   - ***Inicio de sesión inválida***
      - Aparece un mensaje indicando que se ingresaron los datos incorrectos y el sistema permitirá que el usuario reintente ingresar sus datos. 
   - ***Inicio de sesión válido***  
    - Dirige al usuario a la pantalla principal del Administrador.
    - En esta sección se encontrará con el chat Jpix y el Panel CRUD la cual se divide en 4 secciones que son las siguientes:
      - **Gestión de cursos**: En esta sección el administrador puede modificar o eliminar detalles acerca de los cursos filtrandose por tipo "Obligatorio", "Fofu" y "Optativos", y se presentan opciones para añadir otro curso si lo ve necesario.
      - **Gestión de sedes y salas**: Aquí se maneja la distribución de asignaturas entre sedes y sus respectivas salas, siendo factible la modificación de salas al asignarle un curso.
      - **Gestión de traslados**: Se muestra una vista de la distancia entre sedes, dando la opción de modificar las sedes existentes de ciertas áreas para realizar un cálculo más real de la distancia existente.
      - **Configuración de Reglas Académicas**: El administrador modifica las reglas académicas para ir abarcando cada caso posible que pueda enfrentar un estudiante al momento de inscribir una asignatura.
      
      Todas estas secciones al momento de guardar sus cambios respectivos se van actualizando independientemente las reglas académicas que deben de cumplir los estudiantes para poder inscribir asignaturas. Y una vez actualizada se da por finalizado el proceso de modificación.

2.3. **Sin cuenta**
  - El usuario pasa a la página de Registro en la cual deberá de rellenar los campos pedidos por el formulario.
  - Al ingresar sus datos el sistema deberá de preguntarse si existe el RUT en la base de datos.
    - **Caso "existe usuario"**: El sistema al ya tener guardado el RUT en la base de datos de la universidad mostrará al usuario un mensaje indicando que ya existe su cuenta, redirigiendo al usuario a la pantalla de selección de rol para que ingrese correctamente. 
    - **Caso "no existe usuario"**: Si el RUT no se encuentra en la base de datos de la universidad el sistema se pregunta si el RUT ingresado pertenece a la universidad. 
      - **RUT inválido**: El sistema impimirá un mensaje indicando que el usuario no pertence a la comunidad universitaria, dirigiendolo a la Pantalla de Bienvenida.
      - **RUT válido**: El RUT al pertenecer a la comunidad universitaria se añade a la base de datos imprimiendo un mensaje indicando su registro con éxito para posteriormente dirigir al usuario a la Pantalla de Bienvenida. 

---

### Experiencia de Usuario Esperada

La experiencia de usuario (UX) es fundamental en el diseño de Jpix, ya que busca ofrecer una interfaz intuitiva, accesible y eficiente. El objetivo es que los usuarios puedan navegar por la aplicación de manera sencilla y agradable, maximizando la eficiencia en el proceso de construcción de horarios y consultas, mientras garantizan un acceso igualitario para todas las personas, independientemente de sus capacidades.

- **Eficiencia**  
  - El chat central permite realizar acciones con pocos pasos.  
  - Accesos directos a catálogo, calendario y validaciones.  
  - Evita navegación confusa.  

- **Accesibilidad**  
  - Contraste suficiente (WCAG AA).  
  - Navegación con teclado.  
  - Etiquetas claras en formularios.  
  - Diseño responsivo (usable en móvil y escritorio).  
  - Texto alternativo en íconos e imágenes.  

- **Estética**  
  - Interfaz minimalista, coherente y clara.  
  - Uso de colores semánticos (verde=OK, amarillo=advertencia, rojo=error).  
  - Iconografía universal (lupa=buscar, calendario=horario, chat=asistente).  
  - Retroalimentación visual y textual inmediata en cada acción.  

---

### Principios de UX Aplicados

- **Usabilidad**: interfaz intuitiva, chat + botones rápidos, navegación simple.  
- **Accesibilidad**: cumplimiento de WCAG (Perceptible, Operable, Comprensible, Robusto).  
- **Consistencia**: estilos, formularios y componentes mantienen coherencia visual.  
- **Retroalimentación**: mensajes y alertas inmediatas (ej: choques, traslados inviables, sobrecarga IRA).  
- **Diseño adaptativo**: interfaz responsive en dispositivos móviles y web.  

---

### Patrones de Diseño UX Utilizados

- **Chat central con widgets embebidos**: el asistente responde con vistas gráficas (mini calendario, listado filtrado, paneles de alerta).  
- **Cards layout**: cada curso mostrado como tarjeta con info clave (docente, sede, horario, créditos).  
- **Calendar view**: horario semanal con bloques coloreados por tipo de curso.  
- **Alert panels / Toasts**: choques y traslados mostrados en mensajes emergentes claros.  
- **Formularios accesibles**: login y registro con etiquetas, validaciones y ayudas contextuales.  

---

### Accesibilidad (WCAG 2.1) en la UI

- **Perceptible**:  
  - Contraste adecuado y fuentes legibles.  
  - Texto alternativo en íconos e imágenes.  

- **Operable**:  
  - Navegación por teclado en todos los formularios y pantallas.  
  - Orden lógico de tabulación.  

- **Comprensible**:  
  - Lenguaje claro y simple en mensajes.  
  - Estructura de encabezados lógica (H1 → H2 → H3).  
  - Mensajes de error específicos y contextualizados.  

- **Robusto**:  
  - Compatible con tecnologías de asistencia (atributos ARIA).  
  - Marcado semántico correcto para formularios y navegación.  

---
