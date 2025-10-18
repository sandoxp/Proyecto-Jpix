import { Component } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HorarioService } from '../../services/horario.service';
import { AsignaturasService, Asignatura, Seccion } from '../../services/asignaturas.service';

type CourseType = 'Obligatorio' | 'FoFu' | 'Electivo' | string;
type Segment = 'all' | 'obligatorio' | 'fofu' | 'ingles' | 'electivo';

interface Course {
  code: string; name: string; type: CourseType;
  credits: number; professor: string; schedule: string[];
  campus: string; approval: number;
}

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  standalone: false,
})
export class CatalogoPage {
  courses: Course[] = [];
  loading = true;
  filter: Segment = 'all';

  // Para saber qué está agregado (des/activar botones)
  addedCodes = new Set<string>();

  constructor(
    private toastCtrl: ToastController,
    private router: Router,
    private api: AsignaturasService,
    private horario: HorarioService,
  ) {}

  async ngOnInit() {
    const user = localStorage.getItem('user');
    if (!user) this.router.navigate(['/login']);

    // Sigue el estado del horario
    this.horario.codes$.subscribe(set => this.addedCodes = set);

    await this.loadFromApi();
  }

  trackByCode(_: number, c: Course) { return c.code; }

  async addCourse(c: Course) {
    if (this.horario.isAdded(c.code)) {
      const t = await this.toastCtrl.create({ message: `${c.code} ya está en tu horario`, duration: 1500, color: 'warning' });
      return t.present();
    }

    const res = this.horario.addFromCatalog(c.code, c.type, c.campus, c.schedule);
    if (!res.ok) {
      const lines = res.conflicts
        .slice(0, 3) // muestra hasta 3 choques
        .map(x => `${x.day} ${x.block} ocupado por ${x.with}`)
        .join(' · ');
      const t = await this.toastCtrl.create({
        message: `No se pudo agregar. Choques: ${lines}${res.conflicts.length > 3 ? '…' : ''}`,
        duration: 2200,
        color: 'danger'
      });
      return t.present();
    }

    const toast = await this.toastCtrl.create({
      message: `${c.code} agregado al borrador de horario`,
      duration: 1500, position: 'bottom', color: 'success'
    });
    await toast.present();
  }

  async removeCourse(code: string) {
    const removed = this.horario.removeByCode(code);
    const t = await this.toastCtrl.create({
      message: removed ? `${code} eliminado del horario` : `${code} no estaba en tu horario`,
      duration: 1400, color: removed ? 'medium' : 'warning'
    });
    t.present();
  }

  isAdded(code: string) { return this.addedCodes.has(code); }

  // ==== Carga y helpers (idénticos a los tuyos) ====
  private async loadFromApi() {
    try {
      const simples = await firstValueFrom(this.api.list());
      const details: (Asignatura | null)[] = await Promise.all(
        simples.map(a => firstValueFrom(this.api.get(a.sigla)).catch(() => null))
      );

      const list: Course[] = [];
      for (const a of details) {
        if (!a) continue;
        const approval = this.toApproval(a.tasa_aprobacion_pct, a.tasa_aprobacion);
        const tipoTxt = this.tipoTexto(a.tipo);

        if (!a.secciones?.length) {
          list.push({ code: a.sigla, name: a.nombre, type: tipoTxt, credits: a.creditos || 0,
            professor: '', schedule: ['No tiene'], campus: '', approval });
          continue;
        }

        for (const s of a.secciones) {
          const campus = this.firstNonEmpty((s.bloques || []).map(b => b.sede || '')) || '';
          const schedule = this.makeScheduleStrings(s);
          list.push({
            code: `${a.sigla}-${s.seccion}`, name: a.nombre, type: tipoTxt,
            credits: a.creditos || 0, professor: s.docente || '', schedule, campus, approval
          });
        }
      }
      list.sort((x, y) => x.code.localeCompare(y.code));
      this.courses = list;
    } finally { this.loading = false; }
  }

  private diaLabel(d: string): string {
    switch (d) { case 'LUN': return 'Lunes'; case 'MAR': return 'Martes'; case 'MIE': return 'Miércoles';
      case 'JUE': return 'Jueves'; case 'VIE': return 'Viernes'; case 'SAB': return 'Sábado'; default: return d; }
  }
  private makeScheduleStrings(s: Seccion): string[] {
    const lines: string[] = [];
    for (const b of (s.bloques || [])) {
      const dia = this.diaLabel(b.dia);
      if (b.clave_ini && b.clave_fin) lines.push(`${dia} ${b.clave_ini}-${b.clave_fin}`);
      else if (b.hora_inicio && b.hora_fin) lines.push(`${dia} ${b.hora_inicio}-${b.hora_fin}`);
    }
    return lines.length ? lines : ['No tiene'];
  }
  private firstNonEmpty(arr: string[]) { return arr.find(x => !!x && x.trim().length > 0) || ''; }
  private toApproval(p?: string | null, f?: number | null): number {
    if (p && /\d/.test(p)) return parseInt(p.replace('%','').trim(), 10);
    if (typeof f === 'number') return Math.round(f * 100);
    return 0;
  }
  private tipoTexto(t?: string): 'Obligatorio' | 'FoFu' | 'Electivo' | string {
    switch ((t || '').toLowerCase()) {
      case 'obligatoria': return 'Obligatorio';
      case 'fofu': return 'FoFu';
      case 'ingles': return 'Inglés';
      case 'optativa': return 'Electivo';
      default: return t || '';
    }
  }

  // ====== Filtro por tipo ======
  private normalize(t: string) {
    return (t || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  }
  get counts() {
    const out = { obligatorio: 0, fofu: 0, ingles: 0, electivo: 0 };
    for (const c of this.courses) {
      const t = this.normalize(c.type);
      if (t.includes('oblig')) out.obligatorio++;
      else if (t.includes('fofu')) out.fofu++;
      else if (t.includes('ingles')) out.ingles++;
      else out.electivo++;
    }
    return out;
  }
  get viewCourses(): Course[] {
    if (this.filter === 'all') return this.courses;
    const f = this.filter;
    return this.courses.filter(c => {
      const t = this.normalize(c.type);
      if (f === 'obligatorio') return t.includes('oblig');
      if (f === 'fofu')        return t.includes('fofu');
      if (f === 'ingles')      return t.includes('ingles');
      if (f === 'electivo')    return t.includes('elect') || t.includes('optat');
      return true;
    });
  }
}
