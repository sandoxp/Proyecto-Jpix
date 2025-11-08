import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type CourseType = 'obligatorio' | 'optativo' | 'fofu' | 'ingles';

export interface CourseCell {
  code: string;     // p.ej. "INF1211-1"
  title: string;
  kind: string;     // texto visible: "Obligatorio", "FoFu", ...
  room: string;     // sede/sala (AQUÍ ESTÁ LA SEDE: 'CC', 'CU', 'IBC', etc.)
  mode: string;     // "Presencial" (placeholder)
  type: CourseType;   // estilos en el horario
}

export type ScheduleMap = Record<string, Record<string, CourseCell | null>>;

/** Conflicto de tipo "Tope de horario" */
export interface ScheduleConflict { 
  type: 'schedule'; 
  day: string; 
  block: string; 
  with: string; 
}

/** Conflicto de tipo "Traslado imposible" */
export interface TransportConflict { 
  type: 'transport'; 
  day: string; 
  block: string; // El bloque del ramo con el que choca
  from: string;  // Sede del ramo A
  to: string;    // Sede del ramo B
}

export type AddResult = { ok: true } | { ok: false; error: (ScheduleConflict | TransportConflict)[] };

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const BLOCKS = Array.from({ length: 16 }, (_, i) => String(i + 1)); // 1..16 (hasta 15-16)

// --- 1. ELIMINAMOS LA 'KEY' GLOBAL DE AQUÍ ---
// const KEY = 'jpix_horario_schedule_v1'; 

// --- (Lógica de Sedes y helpers no cambian) ---
const GRUPO_CERCANO = new Set(['FIN', 'CC', 'RC', 'IBC', 'RA', 'ING AU', 'ICT', 'SIB', 'G']);
const GRUPO_LEJANO = new Set(['SAU', 'CU']);

function areCampusesIncompatible(campus1: string, campus2: string): boolean {
  if (!campus1 || !campus2) return false;
  const c1Cercano = GRUPO_CERCANO.has(campus1);
  const c1Lejano = GRUPO_LEJANO.has(campus1);
  const c2Cercano = GRUPO_CERCANO.has(campus2);
  const c2Lejano = GRUPO_LEJANO.has(campus2);
  return (c1Cercano && c2Lejano) || (c1Lejano && c2Cercano);
}
function emptySchedule(): ScheduleMap {
  const map: ScheduleMap = {} as any;
  for (const d of DAYS) {
    map[d] = {} as any;
    for (const b of BLOCKS) map[d][b] = null;
  }
  return map;
}
function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

@Injectable({ providedIn: 'root' })
export class HorarioService {

  // --- 2. AÑADIMOS UNA CLAVE DINÁMICA ---
  private KEY: string | null = null; // Se seteará por el AppComponent

  // --- 3. INICIALIZAMOS LOS SUJETOS VACÍOS ---
  private _schedule$ = new BehaviorSubject<ScheduleMap>(emptySchedule());
  readonly schedule$ = this._schedule$.asObservable();

  private _codes$ = new BehaviorSubject<Set<string>>(new Set());
  readonly codes$ = this._codes$.asObservable();

  // 4. Constructor vacío (tu original no tenía nada)
  constructor() {}

  // --- 5. MODIFICAMOS load() Y save() ---
  private load(): ScheduleMap {
    const KEY = this.KEY; // Usa la clave de la clase
    if (!KEY) return emptySchedule(); // Si no hay clave de usuario, horario vacío
    try { 
      return JSON.parse(localStorage.getItem(KEY) || 'null') || emptySchedule(); 
    }
    catch { return emptySchedule(); }
  }
  
  private save(next: ScheduleMap) {
    const KEY = this.KEY; // Usa la clave de la clase
    if (!KEY) return; // No guardar si no hay clave de usuario
    
    localStorage.setItem(KEY, JSON.stringify(next));
    this._schedule$.next(next);
    this._codes$.next(this.computeCodes(next));
  }
  
  // --- 6. AÑADIMOS MÉTODO PÚBLICO DE CONTROL ---
  /**
   * (NUEVO) Le dice al servicio qué usuario está activo
   * y carga su horario.
   */
  public setActiveUser(userId: number | null) {
    this.KEY = userId ? `jpix_horario_${userId}` : null; // Ej: 'jpix_horario_123'
    
    // Forzamos la recarga del horario
    const schedule = this.load();
    this._schedule$.next(schedule);
    this._codes$.next(this.computeCodes(schedule));
  }

  // (El resto de tu código original: isAdded, removeByCode, etc. no cambia)
  isAdded(code: string): boolean {
    return this._codes$.value.has(code);
  }

  removeByCode(code: string): number {
    const cur = clone(this._schedule$.value);
    let removed = 0;
    for (const d of DAYS) {
      for (const b of BLOCKS) {
        if (cur[d][b]?.code === code) {
          cur[d][b] = null;
          removed++;
        }
      }
    }
    if (removed > 0) this.save(cur);
    return removed;
  }

  removeAt(day: string, block: string): void {
    const cur = clone(this._schedule$.value);
    if (cur?.[day]?.[block]) {
      cur[day][block] = null;
      this.save(cur);
    }
  }

  addFromCatalog(code: string, kindText: string, campus: string, slots: string[])
  : AddResult {
    const next = clone(this._schedule$.value);
    const parsedSlots = this.parseSlots(slots);
    const scheduleConflicts: ScheduleConflict[] = [];
    for (const { day, bIni, bFin } of parsedSlots) {
      for (let b = bIni; b <= bFin; b++) {
        const cur = next?.[day]?.[String(b)];
        if (cur) {
          scheduleConflicts.push({ type: 'schedule', day, block: String(b), with: cur.code });
        }
      }
    }
    if (scheduleConflicts.length) return { ok: false, error: scheduleConflicts };
    const transportConflicts: TransportConflict[] = [];
    for (const { day, bIni, bFin } of parsedSlots) {
      const prevBlock = String(bIni - 1);
      const cellBefore = next?.[day]?.[prevBlock];
      if (cellBefore && areCampusesIncompatible(cellBefore.room, campus)) {
        transportConflicts.push({ 
          type: 'transport', day, block: prevBlock, from: cellBefore.room, to: campus
        });
      }
      const nextBlock = String(bFin + 1);
      const cellAfter = next?.[day]?.[nextBlock];
      if (cellAfter && areCampusesIncompatible(campus, cellAfter.room)) {
        transportConflicts.push({ 
          type: 'transport', day, block: nextBlock, from: campus, to: cellAfter.room
        });
      }
    }
    if (transportConflicts.length) return { ok: false, error: transportConflicts };
    const cell: CourseCell = {
      code,
      title: '',
      kind: kindText,
      room: campus || '',
      mode: 'Presencial',
      type: this.mapKindToType(kindText),
    };
    for (const { day, bIni, bFin } of parsedSlots) {
      for (let b = bIni; b <= bFin; b++) {
        if (next?.[day]?.[String(b)] !== undefined) {
          next[day][String(b)] = cell;
        }
      }
    }
    this.save(next);
    return { ok: true };
  }

  private parseSlots(slots: string[]): Array<{ day: string; bIni: number; bFin: number }> {
    const out: Array<{ day: string; bIni: number; bFin: number }> = [];
    for (const s of slots) {
      const [dayRaw, rangeRaw] = (s || '').split(' ').map(x => x.trim());
      if (!dayRaw || !rangeRaw) continue;
      const [ini, fin] = rangeRaw.split('-').map(x => x.trim());
      const bIni = parseInt(ini, 10);
      const bFin = parseInt(fin || ini, 10);
      if (!isFinite(bIni)) continue;
      out.push({ day: dayRaw, bIni, bFin: isFinite(bFin) ? bFin : bIni });
    }
    return out;
  }

  private mapKindToType(kind: string): CourseType {
    const k = (kind || '').toLowerCase();
    if (k.includes('oblig')) return 'obligatorio';
    if (k.includes('fofu')) return 'fofu';
    if (k.includes('ingl')) return 'ingles';
    return 'optativo';
  }

  private computeCodes(map: ScheduleMap): Set<string> {
    const s = new Set<string>();
    for (const d of DAYS) for (const b of BLOCKS) {
      const code = map?.[d]?.[b]?.code;
      if (code) s.add(code);
    }
    return s;
  }
}