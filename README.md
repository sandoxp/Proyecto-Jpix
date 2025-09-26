# Proyecto-Jpix  
Asistente virtual académico para la preinscripción de asignaturas en la PUCV.  

# Presentado por:  
- Isidora Gárate  
- Matias Pardo  
- Joaquín Saldivia  
- Sebastián Sandoval  

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
Jpix es un **asistente virtual académico** diseñado para apoyar a los estudiantes de la PUCV en la **preinscripción de asignaturas**.  
Su objetivo es **organizar horarios viables** considerando:  
- Reprobadas y atrasadas obligatorias.  
- Créditos máximos según **IRA (Índice de Riesgo Académico)**.  
- Asignaturas de Formación Fundamental (FOFU) e Inglés.  
- Choques de horario y traslados inviables entre sedes.  

El estudiante interactúa principalmente mediante **consultas en lenguaje natural**, y Jpix responde con **explicaciones y vistas gráficas** (calendario, catálogos, alertas).  
El administrador gestiona el catálogo de cursos, sedes y reglas académicas que Jpix utiliza.  

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
Diseñar una experiencia de usuario clara, eficiente y accesible, donde el estudiante interactúe con **Jpix como asistente virtual** y, al mismo tiempo, pueda acceder a vistas gráficas (catálogo, calendario, alertas). La navegación debe permitir que los usuarios encuentren fácilmente lo que buscan, comprendan cómo moverse en la aplicación y completen sus tareas sin confusión.

---

### Flujo de Navegación (descripción textual)

> **Nota:** El diagrama se representará en Figma, siguiendo los bloques de *Start/End, Actions y Decisions*.

1. **Inicio (Start)**  
   - Pantalla de bienvenida.  

2. **Selección de Rol**  
   - El usuario decide si entra como **Estudiante** o **Administrador**.  

3. **Rama Estudiante**  
   - Login / Registro.  
   - Pantalla principal de **Chat con Jpix**.  
   - Desde el chat se puede acceder a:  
     - **Catálogo de cursos** (filtros por obligatorias, optativas, FOFU, inglés, sede, día).  
     - **Calendario / Borrador** (visualizar horario semanal con cursos agregados).  
       - Decisión: ¿hay choques de horario? → Sí: alerta.  
       - Decisión: ¿hay traslados inviables? → Sí: advertencia.  
     - **Validación de reglas académicas** (prerrequisitos, FOFU/inglés, límites por IRA).  
       - Decisión: ¿cumple reglas? → No: advertencia específica.  
     - **Generación de propuesta de horario** (Jpix arma un horario completo y lo explica).  
       - Decisión: ¿usuario quiere refinar propuesta? → Sí: vuelve al chat con ajustes (*ej: “menos carga”, “mañana”, “sedes cercanas”*).  

4. **Rama Administrador**  
   - Login Administrador.  
   - **Panel CRUD de Cursos/Sedes**.  
   - **Gestión de reglas académicas** (IRA, traslados entre sedes).  

5. **Fin (End)**  
   - Estudiante: Horario válido generado.  
   - Administrador: Catálogo y reglas actualizadas.  

---

### Experiencia de Usuario Esperada

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
