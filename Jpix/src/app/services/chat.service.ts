import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService, UserData } from '../auth';
import { AsignaturasService, Asignatura, Seccion, Bloque } from './asignaturas.service'; 
import { RequisitosService } from './requisitos.service'; 
import { ProgresoService, ProgresoEstado } from './progreso.service';
import { HorarioService } from './horario.service';

type Flow = 'none' | 'organizar' | 'ubicacion' | 'agregar';
type Step =
  | 'none'
  | 'organizar.awaiting_choice'
  | 'organizar.awaiting_prefs'
  | 'ubicacion.awaiting_sedes'
  | 'agregar.awaiting_confirm';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(
    private auth: AuthService,
    private asignaturas: AsignaturasService,
    private requisitos: RequisitosService,
    private progreso: ProgresoService,
    private horario: HorarioService
  ) {}

  // ====== Estado mínimo de conversación ======
  private flow: Flow = 'none';
  private step: Step = 'none';
  private pendingAsignatura: Asignatura | null = null;
  private sedeOrigen?: string;

  // ====== API ======
  resetConversation(): void {
    this.reset();
  }

  async startFlow(flow: Flow): Promise<string> {
    this.reset();
    switch (flow) {
      case 'organizar':
        this.flow = 'organizar';
        return await this.handleOrganizarStart();
      case 'ubicacion':
        this.flow = 'ubicacion';
        this.step = 'ubicacion.awaiting_sedes';
        return '¡Hola! ¿De qué sedes quieres saber la **ubicación o distancia**? (por ejemplo: "Sausalito y Casa Central")';
      case 'agregar':
        this.flow = 'agregar';
        this.step = 'none';
        return '¡Hola! ¿Qué asignatura deseas inscribir? (por ejemplo: "Inglés II sección A" o "ING-102 A")';
      default:
        this.reset();
        return '¿Quieres **organizar tu horario**, **consultar ubicación** o **añadir una asignatura**?';
    }
  }

  async getResponse(userMessage: string): Promise<string> {
    const raw = (userMessage || '').trim();
    const t = this.norm(raw);

    // 🔧 Logs de debug (puedes comentarlos después)
    console.log('[ChatService] 🎯 Mensaje:', raw);
    console.log('[ChatService] 📝 Normalizado:', t);
    console.log('[ChatService] 🔄 Flow:', this.flow);
    console.log('[ChatService] 📍 Step:', this.step);

    // Comandos para reiniciar rápido
    if (this.includesAny(t, ['cancelar', 'reiniciar', 'reset', 'volver'])) {
      this.reset();
      return 'Listo, reinicié la conversación. ¿Quieres **organizar tu horario**, **consultar ubicación** o **añadir una asignatura**?';
    }

    // -------- PRIMERA PRIORIDAD: ¿el mensaje trae una NUEVA intención fuerte? --------
    const wantsOrganizar = this.isOrganizarIntent(t);
    const wantsUbicacion = this.isUbicacionIntent(t);
    const wantsAgregar = this.isAgregarIntent(t);
    
    if (wantsOrganizar || wantsUbicacion || wantsAgregar) {
      this.step = 'none';
      if (wantsOrganizar) {
        this.flow = 'organizar';
        return await this.handleOrganizarStart();
      }
      if (wantsUbicacion) {
        this.flow = 'ubicacion';
        return this.handleUbicacionStart(raw);
      }
      if (wantsAgregar) {
        this.flow = 'agregar';
        return await this.handleAgregarStart(raw);
      }
    }

    // -------- SEGUNDA PRIORIDAD: si hay un paso pendiente, lo atendemos --------
    if (this.step === 'organizar.awaiting_choice') {
      return this.handleOrganizarChoice(t);
    }
    if (this.step === 'organizar.awaiting_prefs') {
      return this.handleOrganizarPrefs(raw);
    }
    if (this.step === 'ubicacion.awaiting_sedes') {
      return this.handleUbicacionFollowup(raw);
    }
    if (this.step === 'agregar.awaiting_confirm') {
      return await this.handleAgregarConfirm(t);
    }

    // -------- Fallback (sin contexto) --------
    return 'Te ayudo con eso. ¿Quieres **organizar tu horario**, **consultar ubicación** o **añadir una asignatura**?';
  }

  // ====== Detectores de intención (arranque) ======
  private isOrganizarIntent(t: string): boolean {
    return this.includesAny(t, ['organiza', 'organices', 'horario']);
  }

  private isUbicacionIntent(t: string): boolean {
    return this.includesAny(t, ['distancia', 'ubicacion', 'ubicación', 'sede', 'sedes']);
  }
  
  // 🔧 CORREGIDO: Mejorada detección de intención
  private isAgregarIntent(t: string): boolean {
    // Primero verificamos frases completas (más específicas)
    if (this.includesAny(t, [
      'quiero agregar', 'quiero inscribir', 'quiero anadir', 'quiero añadir',
      'deseo agregar', 'deseo inscribir', 'necesito agregar', 'necesito inscribir'
    ])) {
      return true;
    }
    
    // Luego verificamos palabras clave solas
    return this.includesAny(t, [
      'agregar', 'anadir', 'añadir',      // infinitivos
      'agrega', 'anade', 'añade',         // conjugados
      'inscribir', 'inscribe', 'inscribi' // inscripción
    ]);
  }

  // ====== ORGANIZAR ======
  private async handleOrganizarStart(): Promise<string> {
    const student: UserData | null = this.auth.getUser();

    if (!student) {
      this.reset();
      return 'Hubo un error al obtener tus datos. Por favor, inicia sesión de nuevo.';
    }

    const saludo = `¡Hola ${student.nombre}! Según tu avance (semestre ${student.periodo_malla}), te sugiero (de tu catálogo real):`;

    let sugeridas: string[] = [];
    try {
      const response = await firstValueFrom(this.asignaturas.getMiCatalogo());
      const miCatalogo: Asignatura[] = response.data;
      
      sugeridas = miCatalogo.slice(0, 4).map(a => a.nombre);

      if (sugeridas.length === 0) {
        sugeridas = ['(No se encontraron ramos en tu catálogo)'];
      }

    } catch (error) {
      console.error('Error al obtener mi-catalogo en ChatService:', error);
      sugeridas = ['(Error al cargar ramos)', 'Intenta recargar la página'];
    }
    
    const lista = sugeridas.map(x => `• ${x}`).join('\n');

    this.step = 'organizar.awaiting_choice';
    return `${saludo}\n${lista}\n\n¿Quieres una **propuesta automática** o prefieres **agregar manualmente** desde el catálogo?`;
  }

  private handleOrganizarChoice(t: string): string {
    const isAuto = this.includesAny(t, [
      'auto', 'automatica', 'automático', 'automatico',
      'propuesta automatica', 'propuesta automática'
    ]);
    const isManual = this.includesAny(t, ['manual', 'manualmente']);

    if (isAuto || t === 'si' || t === 'sí') {
      this.step = 'organizar.awaiting_prefs';
      return 'Perfecto, generaré una propuesta **automática** sin choques y respetando prerequisitos. ¿Tienes preferencias? (ej: "menos carga", "evitar traslados", "sin clases viernes"). Si prefieres **manual**, dímelo ahora.';
    }

    if (isManual) {
      this.step = 'none';
      return 'Genial. Abre el **Catálogo** y ve agregando. Si quieres, te aviso si hay choques o prerequisitos incumplidos mientras avanzas.';
    }

    return '¿Prefieres **propuesta automática** o **construir manualmente**?';
  }

  private handleOrganizarPrefs(raw: string): string {
    this.step = 'none';
    return `Anotado: "${raw}". Generaré una propuesta considerando eso (demo). ¿Quieres que te muestre el **borrador** o agregar ramos **manual** ahora?`;
  }

  // ====== UBICACIÓN / DISTANCIA ======
  private handleUbicacionStart(raw: string): string {
    const sedes = this.detectSedes(raw);
    if (sedes.length >= 2) {
      const km = this.distanceKm(sedes[0], sedes[1]);
      this.step = 'none';
      return `Entre **${sedes[0]}** y **${sedes[1]}** hay aprox. **${km} km** (ruta usual). ¿Quieres sugerencias de traslado entre bloques?`;
    }
    if (sedes.length === 1) {
      this.sedeOrigen = sedes[0];
      this.step = 'ubicacion.awaiting_sedes';
      const otras = this.CAMPUSES.filter(s => s !== this.sedeOrigen).join(', ');
      return `Ok, ¿contra qué sede comparo **${this.sedeOrigen}**? (Opciones: ${otras})`;
    }
    this.step = 'ubicacion.awaiting_sedes';
    return '¡Hola! ¿De qué sedes quieres saber la **ubicación o distancia**? (por ejemplo: "Sausalito y Casa Central")';
  }

  private handleUbicacionFollowup(raw: string): string {
    const sedes = this.detectSedes(raw);
    if (sedes.length >= 2) {
      this.step = 'none';
      const km = this.distanceKm(sedes[0], sedes[1]);
      return `Entre **${sedes[0]}** y **${sedes[1]}** hay aprox. **${km} km** (ruta usual). ¿Quieres sugerencias de traslado entre bloques?`;
    }
    if (sedes.length === 1 && this.sedeOrigen && sedes[0] !== this.sedeOrigen) {
      this.step = 'none';
      const km = this.distanceKm(this.sedeOrigen, sedes[0]);
      const a = this.sedeOrigen;
      const b = sedes[0];
      this.sedeOrigen = undefined;
      return `Entre **${a}** y **${b}** hay aprox. **${km} km** (ruta usual). ¿Quieres sugerencias de traslado entre bloques?`;
    }
    const otras = this.CAMPUSES.filter(s => s !== this.sedeOrigen).join(', ');
    return `Necesito dos sedes. Por ejemplo: "${this.sedeOrigen ?? 'Sausalito'} y Casa Central". (Opciones: ${otras})`;
  }

  private readonly CAMPUSES = ['Casa Central', 'Sausalito', 'CURAU', 'Quillota'];
  private readonly DISTANCES: Record<string, Record<string, number>> = {
    'Casa Central': { 'Sausalito': 3.8, 'CURAU': 6.5, 'Quillota': 40 },
    'Sausalito': { 'Casa Central': 3.8, 'CURAU': 4.2, 'Quillota': 38 },
    'CURAU': { 'Casa Central': 6.5, 'Sausalito': 4.2, 'Quillota': 35 },
    'Quillota': { 'Casa Central': 40, 'Sausalito': 38, 'CURAU': 35 },
  };

  private detectSedes(raw: string): string[] {
    const t = this.norm(raw);
    const found: string[] = [];
    for (const s of this.CAMPUSES) {
      if (t.includes(this.norm(s))) found.push(s);
    }
    return [...new Set(found)];
  }

  private distanceKm(a: string, b: string): number {
    const x = this.DISTANCES[a]?.[b];
    if (typeof x === 'number') return x;
    return this.DISTANCES[b]?.[a] ?? 0;
  }

  // ====================================================================
  // --- SECCIÓN "AGREGAR ASIGNATURA" ---
  // ====================================================================

  // 🔧 CORREGIDO: Validación mejorada
  private async handleAgregarStart(raw: string): Promise<string> {
    const cleanQuery = this.cleanSearchQuery(raw);
    
    console.log('[ChatService] 🔍 Query limpio:', cleanQuery);
    
    if (cleanQuery.length < 2) {
      this.step = 'none';
      return `No pude identificar qué asignatura buscas en "${raw}". 
Intenta con: "agregar Inglés II" o "inscribir INF-123"`;
    }

    let results: Asignatura[] = [];
    try {
      const response = await firstValueFrom(this.asignaturas.buscar(cleanQuery));
      results = response.data || []; // 🔧 AÑADIDO: fallback si data es undefined
    } catch (error) {
      console.error('Error al buscar asignatura:', error);
      this.step = 'none';
      return 'Lo siento, tuve un error al buscar en el catálogo. Intenta de nuevo.';
    }

    // CASO 0: No se encontró nada
    if (results.length === 0) {
      this.step = 'none';
      return `No encontré ninguna asignatura que coincida con "${cleanQuery}". Intenta con la sigla o un nombre diferente.`;
    }

    // CASO 1: ¡Éxito! Un solo resultado.
    if (results.length === 1) {
      const asignatura = results[0];
      const sigla = asignatura.sigla;

      let horarioMsg = 'No se encontraron secciones para este ramo.';
      let prereqMsg = 'No se pudieron verificar los prerrequisitos.';
      let puedeInscribir = false;

      try {
        const [resHorario, resPrereq] = await Promise.all([
          firstValueFrom(this.asignaturas.getBySigla(sigla)),
          firstValueFrom(this.requisitos.verificar(sigla))
        ]);

        const secciones = resHorario.data?.secciones || []; // 🔧 AÑADIDO: optional chaining
        if (secciones.length > 0) {
          horarioMsg = this.formatHorarios(secciones);
        }

        const verificacion = resPrereq.data;
        prereqMsg = verificacion?.message || 'No se pudo verificar'; // 🔧 AÑADIDO: optional chaining
        puedeInscribir = verificacion?.met_all || false; // 🔧 AÑADIDO: fallback

      } catch (error) {
        console.error('Error al obtener detalles de asignatura o prerrequisitos:', error);
        prereqMsg = '❌ Error al verificar prerrequisitos.';
        horarioMsg = 'Error al cargar secciones.';
      }

      if (!puedeInscribir) {
        this.step = 'none';
        this.pendingAsignatura = null;
        return `Encontré: **${asignatura.nombre} (${sigla})**.\n\n${prereqMsg}\n\nRevisa tu progreso e inténtalo de nuevo cuando cumplas los requisitos.`;
      }

      this.pendingAsignatura = asignatura;
      this.step = 'agregar.awaiting_confirm';

      return `¡Encontré 1 resultado! **${asignatura.nombre} (${sigla})**.\n\n${prereqMsg}\n\nSecciones disponibles:\n${horarioMsg}\n\n¿Deseas **añadirlo al borrador** del horario? (sí/no)`;
    }

    // CASO 2: Varios resultados (lista corta)
    if (results.length <= 5) {
      this.step = 'none';
      const lista = results.map(a => `• ${a.nombre} (${a.sigla})`).join('\n');
      return `Tu búsqueda "${cleanQuery}" es ambigua. Encontré ${results.length} resultados:\n${lista}\n\nPor favor, sé más específico (ej: "agregar ${results[0].sigla}")`;
    }

    // CASO 3: Demasiados resultados
    this.step = 'none';
    return `Tu búsqueda "${cleanQuery}" es muy general. Encontré más de ${results.length} resultados. Por favor, sé más específico (intenta con la sigla).`;
  }

  private async handleAgregarConfirm(t: string): Promise<string> {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('[handleAgregarConfirm] 🎯 INICIO');
    console.log('[handleAgregarConfirm] Usuario respondió:', t);
    console.log('═══════════════════════════════════════════════════════════════');

    const esAfirmativo = ['si', 'sí', 's', 'yes', 'ok', 'dale', 'claro', 'sep'];

    if (esAfirmativo.includes(t)) {
      console.log('[handleAgregarConfirm] ✅ Usuario confirmó');

      if (!this.pendingAsignatura) {
        console.error('[handleAgregarConfirm] ❌ pendingAsignatura es null');
        this.step = 'none';
        return 'Lo siento, ha ocurrido un error. Por favor, intenta buscar la asignatura de nuevo.';
      }

      const name = this.pendingAsignatura.nombre;
      const sigla = this.pendingAsignatura.sigla;

      try {
        const estadoAGuardar: ProgresoEstado = 'pendiente';

        // PASO 1: Guardar en Backend
        console.log('[handleAgregarConfirm] 🔄 Guardando en Backend...');
        await firstValueFrom(this.progreso.updateProgreso(sigla, estadoAGuardar));
        console.log('[handleAgregarConfirm] ✅ Backend OK');

        // PASO 2: Guardar en HorarioService (localStorage)
        console.log('[handleAgregarConfirm] 🔄 Guardando en HorarioService...');

        // Obtenemos la info completa con secciones
        const response = await firstValueFrom(this.asignaturas.getBySigla(sigla));
        const asignaturaCompleta = response.data;

        if (asignaturaCompleta?.secciones && asignaturaCompleta.secciones.length > 0) {
          const primeraSeccion = asignaturaCompleta.secciones[0];

          // Construimos el código completo (ej: "INF-2241-01")
          const code = `${sigla}-${primeraSeccion.seccion}`;

          // Mapeamos el tipo
          const tipo = asignaturaCompleta.tipo || '';
          let kindText = 'Obligatorio';
          if (tipo.toLowerCase().includes('fofu')) kindText = 'FoFu';
          else if (tipo.toLowerCase().includes('ingles')) kindText = 'Inglés';
          else if (tipo.toLowerCase().includes('optat') || tipo.toLowerCase().includes('elect')) {
            kindText = 'Electivo';
          }

          // Extraemos la sede
          const campus = primeraSeccion.bloques?.[0]?.sede || '';

          // Convertimos los bloques a slots (formato: ["Lunes 1-2", "Martes 3-4"])
          const slots: string[] = [];
          for (const b of primeraSeccion.bloques || []) {
            const diaMap: Record<string, string> = {
              'LUN': 'Lunes',
              'MAR': 'Martes',
              'MIE': 'Miércoles',
              'JUE': 'Jueves',
              'VIE': 'Viernes',
              'SAB': 'Sábado'
            };
            const dia = diaMap[b.dia?.toUpperCase()] || b.dia || '';
            const inicio = b.clave_ini || '1';
            const fin = b.clave_fin || inicio;
            slots.push(`${dia} ${inicio}-${fin}`);
          }

          console.log('[handleAgregarConfirm] 📦 Datos:', { code, kindText, campus, slots });

          // Guardamos en HorarioService
          const result = this.horario.addFromCatalog(code, kindText, campus, slots);

          if (result.ok) {
            console.log('[handleAgregarConfirm] ✅ HorarioService OK');
          } else {
            console.warn('[handleAgregarConfirm] ⚠️  Conflictos detectados:', result.error);
          }
        } else {
          console.warn('[handleAgregarConfirm] ⚠️  Sin secciones, solo guardado en backend');
        }

        this.pendingAsignatura = null;
        this.step = 'none';

        console.log('[handleAgregarConfirm] ✅ ÉXITO COMPLETO');
        console.log('═══════════════════════════════════════════════════════════════');

        return `¡Éxito! **${name}** fue añadido a tu horario.

Puedes verlo en la pestaña **Horario** 📅.

¿Quieres **agregar otro** ramo?`;
      } catch (error) {
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('[handleAgregarConfirm] ❌ ERROR:', error);
        console.error('═══════════════════════════════════════════════════════════════');

        this.pendingAsignatura = null;
        this.step = 'none';

        return `Lo siento, tuve un error al guardar **${name}**.

${error instanceof Error ? error.message : 'Error desconocido'}

¿Quieres intentar con otro ramo?`;
      }
    }

    const esNegativo = ['no', 'n', 'nop', 'nope', 'nel'];
    if (esNegativo.includes(t)) {
      this.pendingAsignatura = null;
      this.step = 'none';
      return 'Sin problema. ¿Quieres revisar otro ramo o finalizar?';
    }

    return '¿Quieres que lo añada al borrador? (responde "sí" o "no")';
  }

  // ====== Utils ======
  private reset(): void {
    this.flow = 'none';
    this.step = 'none';
    this.pendingAsignatura = null;
    this.sedeOrigen = undefined;
  }

  // 🔧🔧🔧 ESTA ES LA CORRECCIÓN CRÍTICA 🔧🔧🔧
  private cleanSearchQuery(raw: string): string {
    let t = this.norm(raw);
    
    console.log('[cleanSearchQuery] Input:', t);
    
    // PASO 1: Detectamos patrones comunes y extraemos lo importante usando REGEX DE CAPTURA
    
    // Patrón: "quiero/deseo/necesito agregar/inscribir [ASIGNATURA]"
    let match = t.match(/(?:quiero|deseo|necesito)\s+(?:agregar|inscribir|anadir|anade|agrega|añadir|añade)\s+(.+)/);
    if (match) {
      console.log('[cleanSearchQuery] Patrón 1 detectado:', match[1]);
      return match[1].trim();
    }
    
    // Patrón: "agregar/inscribir [ASIGNATURA]"
    match = t.match(/(?:agregar|inscribir|anadir|anade|agrega|añadir|añade)\s+(.+)/);
    if (match) {
      console.log('[cleanSearchQuery] Patrón 2 detectado:', match[1]);
      return match[1].trim();
    }
    
    // PASO 2: Si no hay patrón, limpiamos stopwords básicas SOLO (sin tocar verbos)
    const stopwords = ['el', 'la', 'los', 'las', 'de', 'del', 'un', 'una',
                       'ramo', 'asignatura', 'curso', 'materia', 'seccion'];
    
    const palabras = t.split(/\s+/);
    const palabrasLimpias = palabras.filter(p => !stopwords.includes(p));
    
    const resultado = palabrasLimpias.join(' ').trim();
    console.log('[cleanSearchQuery] Resultado:', resultado);
    return resultado;
  }

  private formatHorarios(secciones: Seccion[]): string {
    if (!secciones || secciones.length === 0) {
      return 'No hay secciones con horario definido.';
    }

    const lineas = secciones.map(sec => {
      const nombreSeccion = `• **Sección ${sec.seccion}** (Prof: ${sec.docente || 'N/A'})`;
      
      if (!sec.bloques || sec.bloques.length === 0) {
        return `${nombreSeccion}\n    - Sin horario definido.`;
      }
      
      const lineasBloques = sec.bloques.map(b => {
        return `    - ${b.dia || '???'} ${b.hora_inicio || '??:??'}-${b.hora_fin || '??:??'} (${b.sede || 'N/A'} ${b.sala || ''})`;
      }).join('\n');

      return `${nombreSeccion}\n${lineasBloques}`;
    });

    return lineas.join('\n');
  }

  private norm(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private includesAny(t: string, needles: string[]): boolean {
    return needles.some(n => t.includes(this.norm(n)));
  }
}