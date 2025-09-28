import { Injectable } from '@angular/core';
import { AssistantService } from './assistant.service';

type Flow = 'none' | 'organizar' | 'ubicacion' | 'agregar';
type Step =
  | 'none'
  | 'organizar.awaiting_choice'
  | 'organizar.awaiting_prefs'
  | 'ubicacion.awaiting_sedes'
  | 'agregar.awaiting_confirm';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private assistantService: AssistantService) {}

  // ====== Estado mínimo de conversación ======
  private flow: Flow = 'none';
  private step: Step = 'none';

  // Para "agregar"
  private pendingCourseName?: string;

  // Para "ubicación"
  private sedeOrigen?: string;

  // ====== API compatible con tu ChatPage ======
  getResponse(userMessage: string): string {
    const raw = (userMessage || '').trim();
    const t = this.norm(raw);

    // Permite reiniciar el flujo fácilmente
    if (this.includesAny(t, ['cancelar', 'reiniciar', 'reset', 'volver'])) {
      this.reset();
      return 'Listo, reinicié la conversación. ¿Quieres **organizar tu horario**, **consultar ubicación** o **añadir una asignatura**?';
    }

    // 1) Si estoy esperando algo específico, manejo ese paso primero
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
      return this.handleAgregarConfirm(t);
    }

    // 2) Si no hay paso pendiente, detecto intención inicial
    if (this.isOrganizarIntent(t)) {
      this.flow = 'organizar';
      return this.handleOrganizarStart();
    }

    if (this.isUbicacionIntent(t)) {
      this.flow = 'ubicacion';
      return this.handleUbicacionStart(raw);
    }

    if (this.isAgregarIntent(t)) {
      this.flow = 'agregar';
      return this.handleAgregarStart(raw);
    }

    // 3) Fallback
    return 'Te ayudo con eso. ¿Quieres **organizar tu horario**, **consultar ubicación** o **añadir una asignatura**?';
  }

  // ====== Detectores de intención (mensaje de arranque) ======
  private isOrganizarIntent(t: string): boolean {
    return this.includesAny(t, ['organiza', 'organices', 'horario']);
  }
  private isUbicacionIntent(t: string): boolean {
    return this.includesAny(t, ['distancia', 'ubicacion', 'ubicación', 'sede']);
  }
  private isAgregarIntent(t: string): boolean {
    return this.includesAny(t, ['añade', 'anade', 'agrega', 'inscribir', 'inscribe']);
  }

  // ====== ORGANIZAR ======
  private handleOrganizarStart(): string {
    const student = this.assistantService.getStudentData();

    // Normaliza "semester": lo trato como número solo si está entre 1 y 12.
    const parsed = Number((student as any).semester);
    const isSemNumber = Number.isFinite(parsed) && parsed >= 1 && parsed <= 12;

    const saludo = isSemNumber
      ? `¡Hola ${student.name}! Según tu avance (semestre ${parsed}), te podrían corresponder:`
      : `¡Hola ${student.name}! Tomo tu período "${(student as any).semester}". Te podrían corresponder (en general):`;

    const sugeridas = isSemNumber
      ? this.sugerirPorSemestre(parsed)
      : ['Estructuras de Datos', 'Bases de Datos', 'Inglés II', 'FOFU'];

    const lista = sugeridas.map(x => `• ${x}`).join('\n');

    this.step = 'organizar.awaiting_choice';
    return `${saludo}\n${lista}\n\n¿Quieres una **propuesta automática** o prefieres **agregar manualmente** desde el catálogo?`;
  }

  private handleOrganizarChoice(t: string): string {
    // Acepto muchas variantes
    const isAuto = this.includesAny(t, [
      'auto',
      'automatica',
      'automático',
      'automatico',
      'propuesta automatica',
      'propuesta automática',
    ]);
    const isManual = this.includesAny(t, ['manual', 'manualmente']);

    if (isAuto || t === 'si' || t === 'sí') {
      // Si dijo "sí" sin especificar, asumimos automática por defecto
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
    // Aquí solo confirmamos preferencias (demo)
    this.step = 'none';
    return `Anotado: "${raw}". Generaré una propuesta considerando eso (demo). ¿Quieres que te muestre el **borrador** o agregar ramos **manual** ahora?`;
  }

  private sugerirPorSemestre(sem: number): string[] {
    if (sem <= 2) return ['Cálculo II', 'Programación Avanzada', 'Inglés II', 'FOFU 1'];
    if (sem === 3) return ['Estructuras de Datos', 'Bases de Datos', 'Inglés II', 'FOFU 2'];
    if (sem === 4) return ['Sistemas Operativos', 'Ingeniería de Software', 'FOFU 3', 'Optativo 1'];
    return ['Optativo', 'FOFU', 'Electivo Profesional'];
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
    // quita duplicados
    return [...new Set(found)];
  }

  private distanceKm(a: string, b: string): number {
    const x = this.DISTANCES[a]?.[b];
    if (typeof x === 'number') return x;
    return this.DISTANCES[b]?.[a] ?? 0;
  }

  // ====== AÑADIR ASIGNATURA ======
  private handleAgregarStart(raw: string): string {
    const mention = this.detectarRamo(raw);
    if (mention) {
      this.pendingCourseName = mention;
      this.step = 'agregar.awaiting_confirm';
      const horarios = [
        '• Lun 3-4 — CC-202 (Casa Central)',
        '• Mie 3-4 — CC-202 (Casa Central)',
      ].join('\n');
      const prereqMsg = '✅ Puedes tomarlo, ya que aprobaste **Inglés I**.';
      return `Perfecto, **${mention}** tiene este horario:\n${horarios}\n\n${prereqMsg}\n¿Deseas **añadirlo al borrador** del horario? (sí/no)`;
    }
    this.step = 'none';
    return '¡Hola! ¿Qué asignatura deseas inscribir? (por ejemplo: "Inglés II sección A" o "ING-102 A")';
  }

  private handleAgregarConfirm(t: string): string {
    if (t === 'si' || t === 'sí') {
      const name = this.pendingCourseName ?? 'la asignatura';
      // Aquí podrías llamar a un ScheduleService para guardar de verdad.
      this.pendingCourseName = undefined;
      this.step = 'none';
      return `Listo, **${name}** quedó en tu borrador. ¿Quieres **agregar otro** ramo o **ver el horario**?`;
    }
    if (this.includesAny(t, ['no', 'n'])) {
      this.pendingCourseName = undefined;
      this.step = 'none';
      return 'Sin problema. ¿Quieres revisar otro ramo o finalizar?';
    }
    return '¿Quieres que lo añada al borrador? (responde "sí" o "no")';
  }

  private detectarRamo(message: string): string | null {
    const t = this.norm(message);
    if (t.includes('ingles ii') || t.includes('ingles 2')) return 'Inglés II';
    const codeMatch = message.match(/\b([A-Z]{2,}-\d{2,})\b/);
    if (codeMatch) return codeMatch[1].toUpperCase();
    return null;
  }

  // ====== Utils ======
  private reset() {
    this.flow = 'none';
    this.step = 'none';
    this.pendingCourseName = undefined;
    this.sedeOrigen = undefined;
  }

  private norm(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // quita acentos
  }

  private includesAny(t: string, needles: string[]): boolean {
    return needles.some(n => t.includes(this.norm(n)));
  }
}
