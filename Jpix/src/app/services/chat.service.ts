// ============================================================================
// INTEGRACIÓN COMPLETA DEL FIX EN TU CHAT.SERVICE.TS
// ============================================================================

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
  | 'organizar.awaiting_prefs_decision'  // ← NUEVO: Esperando decisión borrador/manual
  | 'organizar.awaiting_borrador_confirm' // ← NUEVO: Confirmación de borrador
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

  // ====== Estado de conversación ======
  private flow: Flow = 'none';
  private step: Step = 'none';
  private pendingAsignatura: Asignatura | null = null;
  private sedeOrigen?: string;
  
  // ⭐ NUEVO: Borrador propuesto en flujo "organizar"
  private borradorPropuesto: Asignatura[] = [];
  private userPrefs: string = '';

  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  private readonly SYNONYMS = {
    'agregar': ['agregar', 'añadir', 'anadir', 'agrega', 'anade', 'añade', 'inscribir', 'inscribe', 'inscribi', 'registrar', 'registra', 'nuevo', 'adicionar'],
    'eliminar': ['eliminar', 'borrar', 'quitar', 'remover', 'delete', 'remove', 'sacar', 'saca', 'borra'],
    'modificar': ['modificar', 'cambiar', 'actualizar', 'editar', 'update', 'edit', 'alterar', 'altera'],
    'listar': ['listar', 'mostrar', 'ver', 'list', 'show', 'display', 'cuales', 'cuáles', 'cuales son', 'cuáles son', 'dame el', 'me muestras', 'muestra', 'enseña', 'dime'],
    'buscar': ['buscar', 'encontrar', 'search', 'find', 'hablame de', 'hablame de', 'cual es', 'cuál es', 'como es', 'cómo es'],
    'confirmar': ['si', 'sí', 's', 'yes', 'ok', 'dale', 'claro', 'sep', 'de acuerdo', 'adelante', 'seguro', 'vale', 'proceed', 'go', 'yes please', 'yep', 'oks', 'esta bien', 'está bien', 'me parece bien', 'bueno', 'perfecto'],
    'rechazar': ['no', 'nop', 'nope', 'n', 'nel', 'nada', 'cancel', 'cancelar', 'reject', 'abortar', 'abort', 'no gracias', 'mejor no', 'nay', 'nope', 'negative', 'na', 'nothing', 'never'],
    'organizar': ['organiza', 'organices', 'horario', 'planificar', 'agendar', 'schedule', 'calendario', 'programa', 'ordenar', 'organizar', 'organice', 'plan', 'arregla', 'arreglo'],
    'ubicacion': ['distancia', 'ubicacion', 'ubicación', 'sede', 'sedes', 'campus', 'donde', 'dónde', 'location', 'donde queda', 'como llego', 'cómo llego', 'location', 'place', 'localidad'],
    'cancelar': ['cancelar', 'cancel', 'reiniciar', 'reiniciar', 'restart', 'reset', 'volver', 'atrás', 'atras', 'back', 'go back', 'abortar', 'abort', 'empezar de nuevo', 'desde el inicio']
  };

  // ====== API PÚBLICA ======

  resetConversation(): void {
    this.reset();
  }

  async startFlow(flow: Flow): Promise<string> {
    this.reset();
    switch (flow) {
      case 'organizar':
        this.flow = 'organizar';
        const msgOrganizar = await this.handleOrganizarStart();
        this.conversationHistory.push({ role: 'assistant', content: msgOrganizar });
        return msgOrganizar;

      case 'ubicacion':
        this.flow = 'ubicacion';
        this.step = 'ubicacion.awaiting_sedes';
        const msgUbicacion = '¡Hola! ¿De qué sedes quieres saber la **ubicación o distancia**? (por ejemplo: "Sausalito y Casa Central")';
        this.conversationHistory.push({ role: 'assistant', content: msgUbicacion });
        return msgUbicacion;

      case 'agregar':
        this.flow = 'agregar';
        this.step = 'none';
        const msgAgregar = '¡Hola! ¿Qué asignatura deseas inscribir? (por ejemplo: "Inglés II sección A" o "ING-102 A")';
        this.conversationHistory.push({ role: 'assistant', content: msgAgregar });
        return msgAgregar;

      default:
        this.reset();
        const msgDefault = '¿Quieres **organizar tu horario**, **consultar ubicación** o **añadir una asignatura**?';
        this.conversationHistory.push({ role: 'assistant', content: msgDefault });
        return msgDefault;
    }
  }

  async getResponse(userMessage: string): Promise<string> {
    const raw = (userMessage || '').trim();
    const t = this.norm(raw);

    console.log('[ChatService] ═══════════════════════════════════════════════════════');
    console.log('[ChatService] 🎯 Mensaje usuario:', raw);
    console.log('[ChatService] 📝 Normalizado:', t);
    console.log('[ChatService] 🔄 Flow actual:', this.flow);
    console.log('[ChatService] 📍 Step actual:', this.step);
    console.log('[ChatService] ═══════════════════════════════════════════════════════');

    this.conversationHistory.push({ role: 'user', content: raw });

    // ========== PRIORIDAD 0: Cancelar/Reiniciar ==========
    if (this.matchesSynonym(t, 'cancelar')) {
      console.log('[ChatService] 🚫 Comando de cancelar detectado');
      this.reset();
      const msg = 'Listo, reinicié la conversación. ¿Quieres **organizar tu horario**, **consultar ubicación** o **añadir una asignatura**?';
      this.conversationHistory.push({ role: 'assistant', content: msg });
      return msg;
    }

    // ========== PRIORIDAD 1: Detectar intención FUERTE ==========
    const detectedIntention = this.detectMainIntention(t);
    console.log('[ChatService] 🧠 Intención detectada:', detectedIntention);

    if (detectedIntention === 'organizar' && this.flow !== 'organizar') {
      console.log('[ChatService] 🔀 Cambiando a flujo: organizar');
      this.flow = 'organizar';
      this.step = 'none';
      const msg = await this.handleOrganizarStart();
      this.conversationHistory.push({ role: 'assistant', content: msg });
      return msg;
    }

    if (detectedIntention === 'ubicacion' && this.flow !== 'ubicacion') {
      console.log('[ChatService] 🔀 Cambiando a flujo: ubicacion');
      this.flow = 'ubicacion';
      this.step = 'ubicacion.awaiting_sedes';
      const msg = this.handleUbicacionStart(raw);
      this.conversationHistory.push({ role: 'assistant', content: msg });
      return msg;
    }

    if (detectedIntention === 'agregar' && this.flow !== 'agregar') {
      console.log('[ChatService] 🔀 Cambiando a flujo: agregar');
      this.flow = 'agregar';
      this.step = 'none';
      const msg = await this.handleAgregarStart(raw);
      this.conversationHistory.push({ role: 'assistant', content: msg });
      return msg;
    }

    // ========== PRIORIDAD 2: Manejar step pendiente ==========
    if (this.step === 'organizar.awaiting_choice') {
      console.log('[ChatService] 📌 Manejando: organizar.awaiting_choice');
      const msg = this.handleOrganizarChoice(t);
      this.conversationHistory.push({ role: 'assistant', content: msg });
      return msg;
    }

    if (this.step === 'organizar.awaiting_prefs') {
      console.log('[ChatService] 📌 Manejando: organizar.awaiting_prefs');
      const msg = this.handleOrganizarPrefs(raw);
      this.conversationHistory.push({ role: 'assistant', content: msg });
      return msg;
    }

    // ⭐ NUEVO: Manejar decisión de borrador/manual
    if (this.step === 'organizar.awaiting_prefs_decision') {
      console.log('[ChatService] 📌 Manejando: organizar.awaiting_prefs_decision');
      const msg = await this.handleOrganizarPrefsDecision(t);
      this.conversationHistory.push({ role: 'assistant', content: msg });
      return msg;
    }

    // ⭐ NUEVO: Manejar confirmación del borrador
    if (this.step === 'organizar.awaiting_borrador_confirm') {
      console.log('[ChatService] 📌 Manejando: organizar.awaiting_borrador_confirm');
      const msg = await this.handleBorradorConfirm(t);
      this.conversationHistory.push({ role: 'assistant', content: msg });
      return msg;
    }

    if (this.step === 'ubicacion.awaiting_sedes') {
      console.log('[ChatService] 📌 Manejando: ubicacion.awaiting_sedes');
      const msg = this.handleUbicacionFollowup(raw);
      this.conversationHistory.push({ role: 'assistant', content: msg });
      return msg;
    }

    if (this.step === 'agregar.awaiting_confirm') {
      console.log('[ChatService] 📌 Manejando: agregar.awaiting_confirm');
      const msg = await this.handleAgregarConfirm(t);
      this.conversationHistory.push({ role: 'assistant', content: msg });
      return msg;
    }

    // ========== FALLBACK ==========
    console.log('[ChatService] ⚠️  Sin contexto, retornando fallback');
    const fallback = 'Te ayudo con eso. ¿Quieres **organizar tu horario**, **consultar ubicación** o **añadir una asignatura**?';
    this.conversationHistory.push({ role: 'assistant', content: fallback });
    return fallback;
  }

  // ====== DETECTORES DE INTENCIÓN (sin cambios) ======
  private detectMainIntention(t: string): string | null {
    if (this.matchesSynonym(t, 'cancelar')) {
      return 'cancelar';
    }
    if (this.matchesSynonym(t, 'organizar')) {
      console.log('[detectMainIntention] ✓ Detectada intención: organizar');
      return 'organizar';
    }
    if (this.matchesSynonym(t, 'ubicacion')) {
      console.log('[detectMainIntention] ✓ Detectada intención: ubicacion');
      return 'ubicacion';
    }
    if (this.matchesSynonym(t, 'agregar')) {
      console.log('[detectMainIntention] ✓ Detectada intención: agregar');
      return 'agregar';
    }
    return null;
  }

  private matchesSynonym(t: string, category: keyof typeof this.SYNONYMS): boolean {
    const synonyms = this.SYNONYMS[category];
    const found = synonyms.some(syn => t.includes(this.norm(syn)));
    if (found) {
      console.log(`[matchesSynonym] "${category}" encontrado en: "${t}"`);
    }
    return found;
  }

  private isConfirming(t: string): boolean {
    return this.matchesSynonym(t, 'confirmar');
  }

  private isRejecting(t: string): boolean {
    return this.matchesSynonym(t, 'rechazar');
  }

  // ====== FLUJO: ORGANIZAR ======

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
    const isAuto = this.matchesSynonym(t, 'confirmar') || 
                   this.includesAny(t, ['auto', 'automatica', 'automático', 'automatico', 'propuesta']);

    const isManual = this.includesAny(t, ['manual', 'manualmente']);

    if (isAuto) {
      console.log('[handleOrganizarChoice] ✓ Usuario eligió: automático');
      this.step = 'organizar.awaiting_prefs';
      return 'Perfecto, generaré una propuesta **automática** sin choques y respetando prerequisitos. ¿Tienes preferencias? (ej: "menos carga", "evitar traslados", "sin clases viernes"). Si prefieres **manual**, dímelo ahora.';
    }

    if (isManual) {
      console.log('[handleOrganizarChoice] ✓ Usuario eligió: manual');
      this.step = 'none';
      return 'Genial. Abre el **Catálogo** y ve agregando. Si quieres, te aviso si hay choques o prerequisitos incumplidos mientras avanzas.';
    }

    return '¿Prefieres **propuesta automática** o **construir manualmente**?';
  }

  // ⭐ MODIFICADO: Ya no pone step en 'none'
  private handleOrganizarPrefs(raw: string): string {
    console.log('[handleOrganizarPrefs] Preferencias anotadas:', raw);
    
    // Guardamos las preferencias
    this.userPrefs = raw;
    
    // ⭐ CLAVE: Mantener step para esperar decisión sobre borrador/manual
    this.step = 'organizar.awaiting_prefs_decision';
    
    return `Anotado: "${raw}". Generaré una propuesta considerando eso (demo). ¿Quieres que te muestre el **borrador** o agregar ramos **manual** ahora?`;
  }

  // ⭐ NUEVO: Maneja decisión entre borrador/manual
  /**
   * Maneja la decisión entre "borrador" o "manual" después de preferencias.
   * 
   * Si elige "borrador", genera una propuesta y la muestra.
   * Si elige "manual", le dice que vaya al catálogo.
   */
  private async handleOrganizarPrefsDecision(t: string): Promise<string> {
    console.log('[handleOrganizarPrefsDecision] Usuario respondió:', t);

    // Si quiere ver borrador
    const wantsBorrador = this.includesAny(t, [
      'borrador', 'muestra', 'mostrar', 'ver', 'display',
      'propuesta', 'show', 'dame', 'enseña', 'si', 'sí'
    ]);

    // Si quiere agregar manual
    const wantsManual = this.includesAny(t, [
      'manual', 'manualmente', 'yo mismo', 'agregar', 'añadir',
      'voy a', 'me encargo', 'construir', 'no'
    ]);

    if (wantsBorrador) {
      console.log('[handleOrganizarPrefsDecision] ✓ Usuario quiere ver borrador');
      
      // ⭐ AQUÍ: Generar propuesta automática
      await this.generateBorrador();
      
      // Mostrar borrador
      this.step = 'organizar.awaiting_borrador_confirm';
      return this.formatBorrador();
    }

    if (wantsManual) {
      console.log('[handleOrganizarPrefsDecision] ✓ Usuario quiere manual');
      this.step = 'none';
      return 'Perfecto. Abre el **Catálogo** y ve agregando ramos manualmente. Estaré atento a **choques** o **prerequisitos** incumplidos. ¿Comenzamos?';
    }

    return '¿Quieres ver el **borrador** o prefieres **agregar manual**?';
  }

  // ⭐ NUEVO: Genera el borrador basado en catálogo + preferencias
  /**
   * LÓGICA:
   * 1. Obtiene el catálogo completo
   * 2. Filtra asignaturas según:
   *    - Cumplan prerequisitos
   *    - No haya conflictos de horario
   *    - Considere las preferencias (ej: "evitar viernes")
   * 3. Guarda en this.borradorPropuesto
   */
  private async generateBorrador(): Promise<void> {
  try {
    console.log('[generateBorrador] 🔨 Generando borrador automático...');
    
    const response = await firstValueFrom(this.asignaturas.getMiCatalogo());
    let candidatos: Asignatura[] = response.data || [];

    console.log('[generateBorrador] 📚 Candidatos iniciales:', candidatos.length);

    // Filtro 1: Verificar prerequisitos
    const conPrereqs = await Promise.all(
      candidatos.map(async (asig) => {
        try {
          const resPrereq = await firstValueFrom(this.requisitos.verificar(asig.sigla));
          return {
            asignatura: asig,
            cumpleRequisitos: resPrereq.data?.met_all ?? false
          };
        } catch {
          return { asignatura: asig, cumpleRequisitos: false };
        }
      })
    );

    const sinChoquesPrereq = conPrereqs
      .filter(item => item.cumpleRequisitos)
      .map(item => item.asignatura);

    console.log('[generateBorrador] ✓ Con prerequisitos:', sinChoquesPrereq.length);

    // Filtro 2: Considerar preferencias
    let propuesta = sinChoquesPrereq;

    if (this.userPrefs.toLowerCase().includes('viernes')) {
      propuesta = propuesta.filter(asig => {
        const tieneViernes = asig.secciones?.some(sec =>
          sec.bloques?.some(bloque => bloque.dia?.toUpperCase() === 'VIE')
        );
        return !tieneViernes;
      });
      console.log('[generateBorrador] 🗑️  Eliminadas con viernes:', sinChoquesPrereq.length - propuesta.length);
    }

    // ⭐ FILTRO 3 NUEVO: Verificar choques
    console.log('[generateBorrador] 🔍 Verificando choques...');
    
    const sinChoques: Asignatura[] = [];
    
    for (const asig of propuesta) {
      const hayChoque = await this.checkHorarioChoque(asig, sinChoques);
      
      if (!hayChoque) {
        console.log(`[generateBorrador] ✓ OK: ${asig.nombre}`);
        sinChoques.push(asig);
      }
    }

    this.borradorPropuesto = sinChoques.slice(0, 6);

    console.log('[generateBorrador] ✅ Borrador final:', this.borradorPropuesto.length);
    
  } catch (error) {
    console.error('[generateBorrador] ❌ Error:', error);
    this.borradorPropuesto = [];
  }
}

  // ⭐ NUEVO: Formatea el borrador para mostrar al usuario
  /**
   * Retorna un string bonito mostrando:
   * - Nombre de las asignaturas
   * - Secciones disponibles
   * - Horarios
   */
  private formatBorrador(): string {
    if (this.borradorPropuesto.length === 0) {
      return 'No pude generar una propuesta. Intenta con preferencias diferentes o **construye manual**.';
    }

    let msg = '📋 **BORRADOR DE TU HORARIO**\n\nTe propongo estas asignaturas según tu avance y preferencias:\n\n';

    this.borradorPropuesto.forEach((asig, index) => {
      const sigla = asig.sigla;
      const nombre = asig.nombre;
      const seccion = asig.secciones?.[0]?.seccion || '?';
      
      msg += `${index + 1}. **${nombre}** (${sigla}-${seccion})\n`;
      
      // Mostrar horario de la primera sección
      if (asig.secciones?.[0]?.bloques) {
        asig.secciones[0].bloques.forEach(bloque => {
          msg += `   • ${bloque.dia} ${bloque.hora_inicio}-${bloque.hora_fin} (${bloque.sede})\n`;
        });
      }
      
      msg += '\n';
    });

    msg += '---\n\n¿Quieres **confirmar este borrador** (agregará todos estos ramos)? O prefieres **modificarlo manualmente**?\n\n(Responde "sí" para confirmar o "no" para cambiar)';

    return msg;
  }

  // ⭐ NUEVO: Confirma y agrega todas las asignaturas del borrador
  /**
   * Cuando el usuario dice "sí" al borrador:
   * 1. Agrega TODAS las asignaturas del borrador al horario
   * 2. Guarda en backend y HorarioService
   * 3. Muestra confirmación
   */
  private async handleBorradorConfirm(t: string): Promise<string> {
  console.log('[handleBorradorConfirm] Usuario respondió:', t);

  if (this.isConfirming(t)) {
    console.log('[handleBorradorConfirm] ✅ Usuario confirmó');

    if (this.borradorPropuesto.length === 0) {
      this.step = 'none';
      return 'No hay asignaturas para confirmar.';
    }

    try {
      const agregadas: string[] = [];
      const conChoques: Array<{ asig: string; conflictos: string }> = [];
      const conErrores: string[] = [];

      for (const asig of this.borradorPropuesto) {
        try {
          console.log(`[handleBorradorConfirm] 🔄 Agregando: ${asig.nombre}`);
          
          // Guardar en backend
          await firstValueFrom(this.progreso.updateProgreso(asig.sigla, 'pendiente'));

          // Guardar en horario
          const response = await firstValueFrom(this.asignaturas.getBySigla(asig.sigla));
          const asigCompleta = response.data;

          if (asigCompleta?.secciones?.[0]) {
            const primeraSeccion = asigCompleta.secciones[0];
            const code = `${asig.sigla}-${primeraSeccion.seccion}`;
            const tipo = asigCompleta.tipo || 'Obligatorio';
            const campus = primeraSeccion.bloques?.[0]?.sede || '';
            
            const slots: string[] = [];
            for (const b of primeraSeccion.bloques || []) {
              const diaMap: Record<string, string> = {
                'LUN': 'Lunes', 'MAR': 'Martes', 'MIE': 'Miércoles',
                'JUE': 'Jueves', 'VIE': 'Viernes', 'SAB': 'Sábado'
              };
              const dia = diaMap[b.dia?.toUpperCase()] || b.dia || '';
              const inicio = b.clave_ini || '1';
              const fin = b.clave_fin || inicio;
              slots.push(`${dia} ${inicio}-${fin}`);
            }

            // ⭐ USA TU HORARIOSERVICE DIRECTAMENTE
            const result = this.horario.addFromCatalog(code, tipo, campus, slots);
            
            if (result.ok) {
              agregadas.push(asig.nombre);
              console.log(`[handleBorradorConfirm] ✅ ${asig.nombre}`);
            } else {
              // ⭐ NUEVO: Reportar conflictos específicamente
              const scheduleConflicts = result.error.filter((e: any) => e.type === 'schedule');
              const transportConflicts = result.error.filter((e: any) => e.type === 'transport');

              let descripcion = '';
              if (scheduleConflicts.length > 0) {
                descripcion += `Choque: ${scheduleConflicts.map((c: any) => `${c.day} bloque ${c.block}`).join(', ')}`;
              }
              if (transportConflicts.length > 0) {
                descripcion += `${descripcion ? ' + ' : ''}Traslado: ${transportConflicts.map((c: any) => `${c.from} → ${c.to}`).join(', ')}`;
              }

              conChoques.push({ asig: asig.nombre, conflictos: descripcion });
              console.log(`[handleBorradorConfirm] ⚠️  Conflicto: ${asig.nombre}`);
            }
          }
        } catch (error) {
          console.error(`[handleBorradorConfirm] ❌ Error en ${asig.nombre}:`, error);
          conErrores.push(asig.nombre);
        }
      }

      this.borradorPropuesto = [];
      this.step = 'none';

      // Construir respuesta
      let respuesta = '';

      if (agregadas.length > 0) {
        respuesta += `✅ **Agregadas ${agregadas.length}:**\n`;
        agregadas.forEach(a => respuesta += `• ${a}\n`);
        respuesta += '\n';
      }

      if (conChoques.length > 0) {
        respuesta += `⚠️  **${conChoques.length} con conflicto:**\n`;
        conChoques.forEach(c => respuesta += `• ${c.asig}\n  └─ ${c.conflictos}\n`);
        respuesta += '\n';
      }

      if (conErrores.length > 0) {
        respuesta += `❌ **${conErrores.length} con error:**\n`;
        conErrores.forEach(e => respuesta += `• ${e}\n`);
        respuesta += '\n';
      }

      respuesta += `Puedes verlas en **Horario** 📅.\n\n¿Quieres **agregar más** o **finalizar**?`;

      return respuesta;

    } catch (error) {
      console.error('[handleBorradorConfirm] ❌ Error fatal:', error);
      this.step = 'none';
      return `Error al guardar: ${error instanceof Error ? error.message : ''}`;
    }
  }

  if (this.isRejecting(t)) {
    this.borradorPropuesto = [];
    this.step = 'none';
    return '👍 Sin problema. ¿**Manual** desde catálogo o **volver a intentar**?';
  }

  return '¿Confirmar este borrador? (sí/no)';
}

private async checkHorarioChoque(
  asignatura: Asignatura,
  borradorActual: Asignatura[]
): Promise<boolean> {
  try {
    const response = await firstValueFrom(this.asignaturas.getBySigla(asignatura.sigla));
    const asigCompleta = response.data;
    
    if (!asigCompleta?.secciones?.[0]) {
      return false;
    }

    const primeraSeccion = asigCompleta.secciones[0];
    const code = `${asignatura.sigla}-${primeraSeccion.seccion}`;
    const tipo = asigCompleta.tipo || 'Obligatorio';
    const campus = primeraSeccion.bloques?.[0]?.sede || '';
    
    const slots: string[] = [];
    for (const b of primeraSeccion.bloques || []) {
      const diaMap: Record<string, string> = {
        'LUN': 'Lunes', 'MAR': 'Martes', 'MIE': 'Miércoles',
        'JUE': 'Jueves', 'VIE': 'Viernes', 'SAB': 'Sábado'
      };
      const dia = diaMap[b.dia?.toUpperCase()] || b.dia || '';
      const inicio = b.clave_ini || '1';
      const fin = b.clave_fin || inicio;
      slots.push(`${dia} ${inicio}-${fin}`);
    }

    // ⭐ VERIFICA CON TU HORARIOSERVICE
    const result = this.horario.addFromCatalog(code, tipo, campus, slots);

    if (!result.ok) {
      console.log(`[checkHorarioChoque] ❌ Conflicto: ${asignatura.nombre}`);
      return true;
    }

    // ⭐ SI NO TIENE CONFLICTO, DESHACER LA ADICIÓN (fue solo verificación)
    this.horario.removeByCode(code);

    return false;

  } catch (error) {
    console.error('[checkHorarioChoque] ❌ Error:', error);
    return false;
  }
}

  // ====== FLUJO: UBICACIÓN / DISTANCIA (sin cambios) ======
  private handleUbicacionStart(raw: string): string {
    console.log('[handleUbicacionStart] Buscando sedes en:', raw);
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
    console.log('[handleUbicacionFollowup] Procesando seguimiento:', raw);
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
    console.log('[detectSedes] Detectadas:', found);
    return [...new Set(found)];
  }

  private distanceKm(a: string, b: string): number {
    const x = this.DISTANCES[a]?.[b];
    if (typeof x === 'number') return x;
    return this.DISTANCES[b]?.[a] ?? 0;
  }

  // ====== FLUJO: AGREGAR ASIGNATURA (sin cambios principales) ======
  private async handleAgregarStart(raw: string): Promise<string> {
    const cleanQuery = this.cleanSearchQuery(raw);
    
    console.log('[handleAgregarStart] 🔍 Query limpio:', cleanQuery);
    
    if (cleanQuery.length < 2) {
      this.step = 'none';
      return `No pude identificar qué asignatura buscas en "${raw}". 
Intenta con: "agregar Inglés II" o "inscribir INF-123"`;
    }

    let results: Asignatura[] = [];
    try {
      const response = await firstValueFrom(this.asignaturas.buscar(cleanQuery));
      results = response.data || [];
      console.log('[handleAgregarStart] ✓ Búsqueda exitosa, resultados:', results.length);
    } catch (error) {
      console.error('❌ Error al buscar asignatura:', error);
      this.step = 'none';
      return 'Lo siento, tuve un error al buscar en el catálogo. Intenta de nuevo.';
    }

    if (results.length === 0) {
      console.log('[handleAgregarStart] ⚠️  Sin resultados para:', cleanQuery);
      this.step = 'none';
      return `No encontré ninguna asignatura que coincida con "${cleanQuery}". Intenta con la sigla o un nombre diferente.`;
    }

    if (results.length === 1) {
      console.log('[handleAgregarStart] ✓ Un único resultado encontrado');
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

        const secciones = resHorario.data?.secciones || [];
        if (secciones.length > 0) {
          horarioMsg = this.formatHorarios(secciones);
        }

        const verificacion = resPrereq.data;
        prereqMsg = verificacion?.message || 'No se pudo verificar';
        puedeInscribir = verificacion?.met_all || false;

        console.log('[handleAgregarStart] ✓ Prerequisitos verificados, puede inscribir:', puedeInscribir);

      } catch (error) {
        console.error('❌ Error al obtener detalles de asignatura o prerrequisitos:', error);
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

    if (results.length <= 5) {
      console.log('[handleAgregarStart] ⚠️  Múltiples resultados ambiguos:', results.length);
      this.step = 'none';
      const lista = results.map(a => `• ${a.nombre} (${a.sigla})`).join('\n');
      return `Tu búsqueda "${cleanQuery}" es ambigua. Encontré ${results.length} resultados:\n${lista}\n\nPor favor, sé más específico (ej: "agregar ${results[0].sigla}")`;
    }

    console.log('[handleAgregarStart] ⚠️  Demasiados resultados:', results.length);
    this.step = 'none';
    return `Tu búsqueda "${cleanQuery}" es muy general. Encontré más de ${results.length} resultados. Por favor, sé más específico (intenta con la sigla).`;
  }

  private async handleAgregarConfirm(t: string): Promise<string> {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('[handleAgregarConfirm] 🎯 INICIO - Usuario respondió:', t);
    console.log('═══════════════════════════════════════════════════════════════');

    if (this.isConfirming(t)) {
      console.log('[handleAgregarConfirm] ✅ Usuario confirmó con:', t);

      if (!this.pendingAsignatura) {
        console.error('[handleAgregarConfirm] ❌ ERROR: pendingAsignatura es null');
        this.step = 'none';
        return 'Lo siento, ha ocurrido un error. Por favor, intenta buscar la asignatura de nuevo.';
      }

      const name = this.pendingAsignatura.nombre;
      const sigla = this.pendingAsignatura.sigla;

      try {
        const estadoAGuardar: ProgresoEstado = 'pendiente';

        console.log('[handleAgregarConfirm] 🔄 Guardando en Backend con estado:', estadoAGuardar);
        await firstValueFrom(this.progreso.updateProgreso(sigla, estadoAGuardar));
        console.log('[handleAgregarConfirm] ✅ Backend OK');

        console.log('[handleAgregarConfirm] 🔄 Guardando en HorarioService...');

        const response = await firstValueFrom(this.asignaturas.getBySigla(sigla));
        const asignaturaCompleta = response.data;

        if (asignaturaCompleta?.secciones && asignaturaCompleta.secciones.length > 0) {
          const primeraSeccion = asignaturaCompleta.secciones[0];

          const code = `${sigla}-${primeraSeccion.seccion}`;

          const tipo = asignaturaCompleta.tipo || '';
          let kindText = 'Obligatorio';
          if (tipo.toLowerCase().includes('fofu')) kindText = 'FoFu';
          else if (tipo.toLowerCase().includes('ingles')) kindText = 'Inglés';
          else if (tipo.toLowerCase().includes('optat') || tipo.toLowerCase().includes('elect')) {
            kindText = 'Electivo';
          }

          const campus = primeraSeccion.bloques?.[0]?.sede || '';

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

          console.log('[handleAgregarConfirm] 📦 Datos a guardar:', { code, kindText, campus, slots });

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
        console.error('[handleAgregarConfirm] ❌ ERROR FATAL:', error);
        console.error('═══════════════════════════════════════════════════════════════');

        this.pendingAsignatura = null;
        this.step = 'none';

        return `Lo siento, tuve un error al guardar **${name}**.

${error instanceof Error ? error.message : 'Error desconocido'}

¿Quieres intentar con otro ramo?`;
      }
    }

    if (this.isRejecting(t)) {
      console.log('[handleAgregarConfirm] ❌ Usuario rechazó con:', t);
      this.pendingAsignatura = null;
      this.step = 'none';
      return 'Sin problema. ¿Quieres revisar otro ramo o finalizar?';
    }

    console.log('[handleAgregarConfirm] ⚠️  Respuesta no reconocida:', t);
    return '¿Quieres que lo añada al borrador? (responde "sí" o "no")';
  }

  // ====== UTILIDADES ======

  private reset(): void {
    console.log('[reset] 🔄 Reseteando estado completo');
    this.flow = 'none';
    this.step = 'none';
    this.pendingAsignatura = null;
    this.sedeOrigen = undefined;
    this.borradorPropuesto = [];
    this.userPrefs = '';
  }

  private cleanSearchQuery(raw: string): string {
    let t = this.norm(raw);
    
    console.log('[cleanSearchQuery] ═══════════════════════════════════════════');
    console.log('[cleanSearchQuery] Input original:', raw);
    console.log('[cleanSearchQuery] Input normalizado:', t);
    
    let match = t.match(/(?:quiero|deseo|necesito|debo|debe)\s+(?:agregar|inscribir|anadir|anade|agrega|añadir|añade|registrar|registra)\s+(.+)/);
    if (match) {
      console.log('[cleanSearchQuery] ✓ Patrón 1 detectado:', match[1]);
      console.log('[cleanSearchQuery] ═══════════════════════════════════════════');
      return match[1].trim();
    }
    
    match = t.match(/(?:agregar|inscribir|anadir|anade|agrega|añadir|añade|registrar|registra)\s+(.+)/);
    if (match) {
      console.log('[cleanSearchQuery] ✓ Patrón 2 detectado:', match[1]);
      console.log('[cleanSearchQuery] ═══════════════════════════════════════════');
      return match[1].trim();
    }
    
    match = t.match(/^(.+)\s+(?:para inscribir|para agregar|para registrar)$/);
    if (match) {
      console.log('[cleanSearchQuery] ✓ Patrón 3 detectado:', match[1]);
      console.log('[cleanSearchQuery] ═══════════════════════════════════════════');
      return match[1].trim();
    }
    
    console.log('[cleanSearchQuery] ⚠️  Sin patrón específico, limpiando stopwords');
    const stopwords = [
      'el', 'la', 'los', 'las', 'de', 'del', 'un', 'una',
      'ramo', 'asignatura', 'curso', 'materia', 'seccion', 'sección',
      'por favor', 'porfavor', 'me', 'te', 'quiero', 'deseo', 'necesito'
    ];
    
    const palabras = t.split(/\s+/);
    const palabrasLimpias = palabras.filter(p => !stopwords.includes(p));
    
    const resultado = palabrasLimpias.join(' ').trim();
    console.log('[cleanSearchQuery] ✓ Resultado limpio:', resultado);
    console.log('[cleanSearchQuery] ═══════════════════════════════════════════');
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

  getContext() {
    return {
      flow: this.flow,
      step: this.step,
      pendingAsignatura: this.pendingAsignatura,
      sedeOrigen: this.sedeOrigen,
      borradorPropuesto: this.borradorPropuesto,
      userPrefs: this.userPrefs,
      conversationHistory: this.conversationHistory
    };
  }

  getConversationHistory() {
    return this.conversationHistory;
  }
}
