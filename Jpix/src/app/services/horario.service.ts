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

// ==================================================================
// ================== 👇 INTERFACES MODIFICADAS 👇 ==================
// ==================================================================

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

// El resultado de añadir puede ser OK, o un error (de horario o de transporte)
export type AddResult = { ok: true } | { ok: false; error: (ScheduleConflict | TransportConflict)[] };

// ==================================================================
// ================== 👆 FIN DE MODIFICACIÓN 👆 =====================
// ==================================================================


const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const BLOCKS = Array.from({ length: 16 }, (_, i) => String(i + 1)); // 1..16 (hasta 15-16)
const KEY = 'jpix_horario_schedule_v1';

// ==================================================================
// ================== 👇 LÓGICA DE SEDES AÑADIDA 👇 ==================
// ==================================================================

// Sedes "Cercanas" (Eje Brasil, Valparaíso)
// Asumí que SIB y G (que encontré en tus CSV) también son cercanas.
const GRUPO_CERCANO = new Set(['FIN', 'CC', 'RC', 'IBC', 'RA', 'ING AU', 'ICT', 'SIB', 'G']);
// Sedes "Lejanas"
const GRUPO_LEJANO = new Set(['SAU', 'CU']);

/**
 * Comprueba si dos sedes son incompatibles para tener en bloques seguidos.
 * Devuelve 'true' si una es cercana y la otra es lejana.
 */
function areCampusesIncompatible(campus1: string, campus2: string): boolean {
  if (!campus1 || !campus2) return false; // Si alguna sede no está definida, no hay conflicto

  const c1Cercano = GRUPO_CERCANO.has(campus1);
  const c1Lejano = GRUPO_LEJANO.has(campus1);
  
  const c2Cercano = GRUPO_CERCANO.has(campus2);
  const c2Lejano = GRUPO_LEJANO.has(campus2);

  // Es incompatible si (A es cercano Y B es lejano) O (A es lejano Y B es cercano)
  return (c1Cercano && c2Lejano) || (c1Lejano && c2Cercano);
}

// ==================================================================
// ================== 👆 FIN DE LÓGICA DE SEDES 👆 ===================
// ==================================================================

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
  private _schedule$ = new BehaviorSubject<ScheduleMap>(this.load());
  readonly schedule$ = this._schedule$.asObservable();

  private _codes$ = new BehaviorSubject<Set<string>>(this.computeCodes(this._schedule$.value));
  readonly codes$ = this._codes$.asObservable();

  private load(): ScheduleMap {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null') || emptySchedule(); }
    catch { return emptySchedule(); }
  }
  private save(next: ScheduleMap) {
    localStorage.setItem(KEY, JSON.stringify(next));
    this._schedule$.next(next);
    this._codes$.next(this.computeCodes(next));
  }

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

  // ==================================================================
  // ================= 👇 FUNCIÓN MODIFICADA 👇 ======================
  // ==================================================================

  /** Intenta agregar; si hay choques (horario o traslado), no agrega y devuelve los conflictos */
  addFromCatalog(code: string, kindText: string, campus: string, slots: string[])
  : AddResult { // <-- Tipo de retorno modificado
    
    const next = clone(this._schedule$.value);
    const parsedSlots = this.parseSlots(slots);

    // 1. Parse slots y busca conflictos DE HORARIO (tope)
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

    // 2. Busca conflictos DE TRASLADO (sedes)
    const transportConflicts: TransportConflict[] = [];
    for (const { day, bIni, bFin } of parsedSlots) {
      
      // 2A. Revisa el bloque ANTERIOR (ej: si añado 3-4, revisa el 2)
      const prevBlock = String(bIni - 1);
      const cellBefore = next?.[day]?.[prevBlock];
      if (cellBefore && areCampusesIncompatible(cellBefore.room, campus)) {
        transportConflicts.push({ 
          type: 'transport', 
          day, 
          block: prevBlock, // El bloque del ramo que ya estaba
          from: cellBefore.room, // Sede del ramo que ya estaba
          to: campus // Sede del ramo nuevo
        });
      }

      // 2B. Revisa el bloque SIGUIENTE (ej: si añado 3-4, revisa el 5)
      const nextBlock = String(bFin + 1);
      const cellAfter = next?.[day]?.[nextBlock];
      if (cellAfter && areCampusesIncompatible(campus, cellAfter.room)) {
        transportConflicts.push({ 
          type: 'transport', 
          day, 
          block: nextBlock, // El bloque del ramo que ya estaba
          from: campus, // Sede del ramo nuevo
          to: cellAfter.room // Sede del ramo que ya estaba
        });
      }
    }
    if (transportConflicts.length) return { ok: false, error: transportConflicts };

    // 3. Sin choques => pinta
    const cell: CourseCell = {
      code,
      title: '', // El título se podría añadir aquí si lo pasamos desde el catálogo
      kind: kindText,
      room: campus || '', // <- AQUÍ SE GUARDA LA SEDE
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
  // ==================================================================
  // ================= 👆 FIN DE LA MODIFICACIÓN 👆 ===================
  // ==================================================================

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