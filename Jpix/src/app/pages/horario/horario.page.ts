import { Component } from '@angular/core';
import { HorarioService, ScheduleMap } from '../../services/horario.service';

@Component({
  selector: 'app-horario',
  templateUrl: './horario.page.html',
  styleUrls: ['./horario.page.scss'],
  standalone: false,
})
export class HorarioPage {
  query = '';
  days = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
  schedule: ScheduleMap;

  constructor(private horario: HorarioService) {
    this.schedule = {} as any;
    this.horario.schedule$.subscribe(m => this.schedule = m);
  }

  /** Mostrar filas hasta 13–14 por defecto; si hay ramos más tarde, extender */
  get blocks(): string[] {
    const MIN_LAST = 14; // ← “hasta 13–14” por defecto
    const used: number[] = [];

    for (const d of this.days) {
      const row = this.schedule?.[d] || {};
      for (const k of Object.keys(row)) {
        if (row[k]) used.push(+k);
      }
    }
    const last = Math.max(MIN_LAST, used.length ? Math.max(...used) : 0);
    return Array.from({ length: last }, (_, i) => String(i + 1));
  }

  getCourse(day: string, block: string) {
    return this.schedule?.[day]?.[block] ?? null;
  }
  getCourseClass(day: string, block: string): string {
    return this.getCourse(day, block)?.type || '';
  }

  removeCourseByCell(day: string, block: string) {
    const c = this.getCourse(day, block);
    if (c?.code) this.horario.removeByCode(c.code);
  }

  onSearch() { console.log('Buscar:', this.query); }
  onConsultarClaves() { console.log('Consultar claves'); }
  toggleDaltonismo() { document.body.classList.toggle('alto-contraste'); }
}
