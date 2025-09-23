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

## Arquitectura de la Información  

### Flujo de navegación  
```mermaid
flowchart TD

