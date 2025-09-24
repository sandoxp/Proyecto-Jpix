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
- **Estudiante**: Puede consultar, organizar y generar horarios, recibir validaciones y recomendaciones personalizadas.  
- **Administrador**: Gestiona el catálogo de cursos, horarios, sedes y reglas académicas (créditos por IRA, matriz de traslados).  

---

### Requerimientos Funcionales  

#### Rol Estudiante  
- **RF-EST-01**: **Consulta en lenguaje natural**  
  El estudiante puede ingresar consultas en el chat (*“Organiza mi horario”*, *“Agrega Inglés II”*) y Jpix interpreta la intención.  

- **RF-EST-02**: **Explorar catálogo de asignaturas**  
  El estudiante puede visualizar cursos con información de docente, sede, sala, horario y créditos. Puede aplicar filtros (tipo, sede, día).  

- **RF-EST-03**: **Validación automática de reglas académicas**  
  Jpix valida prerrequisitos, inclusión de reprobadas/atrasadas, FOFU/inglés, y límites de créditos por IRA.  

- **RF-EST-04**: **Detección de choques de horario**  
  El sistema alerta cuando dos cursos se traslapan en el mismo bloque.  

- **RF-EST-05**: **Detección de traslados inviables**  
  El sistema advierte cuando un estudiante intenta tomar clases consecutivas en sedes que no alcanzan a conectarse por tiempos de traslado.  

- **RF-EST-06**: **Generación y refinamiento de propuestas de horario**  
  Jpix genera propuestas sin choques, respeta reglas y explica decisiones. Permite ajustes por preferencias (*“quiero menos carga”*, *“prefiero sedes cercanas”*).  

#### Rol Administrador  
- **RF-ADM-01**: **Gestión de catálogo y parámetros**  
  El administrador puede crear, editar o eliminar cursos, secciones y sedes, además de configurar matriz de traslados y límites de créditos por IRA.  

---

### Requerimientos No Funcionales  

- **RNF-01: Accesibilidad**  
  La aplicación debe cumplir principios de accesibilidad (contraste de colores, navegación por teclado, etiquetas claras) para garantizar que cualquier estudiante pueda usarla.  

- **RNF-02: Usabilidad**  
  La interfaz debe ser intuitiva y coherente, con pantallas simples, iconografía clara y retroalimentación visual en cada acción.  

- **RNF-03: Seguridad**  
  El sistema debe proteger la información de los usuarios mediante autenticación con JWT, encriptación de contraseñas con bcrypt y configuración segura de CORS.  

- **RNF-04: Privacidad**  
  Los datos académicos del estudiante deben manejarse con confidencialidad, simulando solo información académica sin exponer datos reales sensibles.  

- **RNF-05: Portabilidad**  
  La aplicación debe ser accesible desde navegadores modernos y adaptarse a dispositivos móviles y de escritorio (diseño responsive).  

- **RNF-06: Disponibilidad**  
  El sistema debe poder instalarse como **PWA**, permitiendo su uso incluso en condiciones de conectividad limitada.  

- **RNF-07: Mantenibilidad**  
  El código debe estar modularizado y documentado, de manera que los cambios futuros (como añadir nuevas reglas académicas) puedan hacerse sin alterar toda la aplicación.  

---

## EP 1.4: Definición de la navegación y experiencia de usuario (UX)

### Objetivo
Diseñar una experiencia de usuario clara, eficiente y accesible, donde el estudiante interactúe con **Jpix como asistente virtual** y, al mismo tiempo, pueda acceder a vistas gráficas (catálogo, calendario, alertas). La navegación debe permitir que los usuarios encuentren fácilmente lo que buscan, comprendan cómo moverse en la aplicación y completen sus tareas sin confusión.

---

### Flujo de Navegación (descripción textual)

> **Nota:** El diagrama se representará en Draw.io / Figma, siguiendo los bloques de *Start/End, Actions y Decisions*.

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
