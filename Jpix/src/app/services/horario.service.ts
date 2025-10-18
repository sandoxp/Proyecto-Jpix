import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type CourseType = 'obligatorio' | 'optativo' | 'fofu' | 'ingles';

export interface CourseCell {
  code: string;      // p.ej. "INF1211-1"
  title: string;
  kind: string;      // texto visible: "Obligatorio", "FoFu", ...
  room: string;      // sede/sala si quieres
  mode: string;      // "Presencial" (placeholder)
  type: CourseType;  // estilos en el horario
}

export type ScheduleMap = Record<string, Record<string, CourseCell | null>>;
export interface Conflict { day: string; block: string; with: string; }

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const BLOCKS = Array.from({ length: 16 }, (_, i) => String(i + 1)); // 1..16 (hasta 15-16)
const KEY = 'jpix_horario_schedule_v1';

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

  /** Devuelve true si el código ya está pintado en algún bloque */
  isAdded(code: string): boolean {
    return this._codes$.value.has(code);
  }

  /** Quita TODAS las celdas de un mismo código. Devuelve cuántas celdas limpió. */
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

  /** Quita una celda puntual (día/bloque) */
  removeAt(day: string, block: string): void {
    const cur = clone(this._schedule$.value);
    if (cur?.[day]?.[block]) {
      cur[day][block] = null;
      this.save(cur);
    }
  }

  /** Intenta agregar; si hay choques, no agrega y devuelve los conflictos */
  addFromCatalog(code: string, kindText: string, campus: string, slots: string[])
  : { ok: true } | { ok: false, conflicts: Conflict[] } {
    const next = clone(this._schedule$.value);

    // Parse slots ("Lunes 3-4") y busca conflictos
    const conflicts: Conflict[] = [];
    for (const { day, bIni, bFin } of this.parseSlots(slots)) {
      for (let b = bIni; b <= bFin; b++) {
        const cur = next?.[day]?.[String(b)];
        if (cur) conflicts.push({ day, block: String(b), with: cur.code });
      }
    }
    if (conflicts.length) return { ok: false, conflicts };

    // Sin choques => pinta
    const cell: CourseCell = {
      code,
      title: '',
      kind: kindText,
      room: campus || '',
      mode: 'Presencial',
      type: this.mapKindToType(kindText),
    };
    for (const { day, bIni, bFin } of this.parseSlots(slots)) {
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
