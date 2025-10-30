import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
// --- MODIFICADO: Importamos los nuevos tipos de error ---
import { HorarioService, ScheduleConflict, TransportConflict } from '../../services/horario.service';
import { AsignaturasService, Asignatura, Seccion } from '../../services/asignaturas.service';
import { ProgresoEstado, AsignaturaConProgreso } from '../../services/progreso.service';
import { AuthService } from 'src/app/auth';

type CourseType = 'Obligatorio' | 'FoFu' | 'Electivo' | string;
type Segment = 'all' | 'obligatorio' | 'fofu' | 'ingles' | 'electivo';
type IraLevel = 'bajo' | 'medio' | 'alto';

interface Course {
  code: string; name: string; type: CourseType;
  credits: number; professor: string; schedule: string[];
  campus: string; approval: number;
  estado: ProgresoEstado;
}

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  standalone: false,
})
export class CatalogoPage implements OnInit {
  allCourses: Course[] = [];
  loading = true;
  filter: Segment = 'all';
  addedCodes = new Set<string>();

  // Lógica de IRA (sin cambios)
  userIRA: IraLevel = 'bajo';
  maxCredits: number = 999;
  maxFofu: number = 999; 
  currentCredits: number = 0;
  currentFofu: number = 0;

  constructor(
    private toastCtrl: ToastController,
    private router: Router,
    private api: AsignaturasService,
    private horario: HorarioService,
    private auth: AuthService 
  ) { }

  async ngOnInit() {
    const user = this.auth.getUser();
    this.userIRA = user?.ira || 'bajo';
    this.setLimitsByIRA();

    this.horario.codes$.subscribe(set => {
      this.addedCodes = set;
      this.calculateCurrentCounts();
    });
    
    await this.loadFromApi();
  }

  private setLimitsByIRA() {
    if (this.userIRA === 'medio') {
      this.maxCredits = 26;
      this.maxFofu = 6;
    } else if (this.userIRA === 'alto') {
      this.maxCredits = 22;
      this.maxFofu = 6;
    } else {
      this.maxCredits = 999;
      this.maxFofu = 999;
    }
  }

  trackByCode(_: number, c: Course) { return c.code; }

  // ==================================================================
  // ================= 👇 FUNCIÓN MODIFICADA (addCourse) 👇 ============
  // ==================================================================
  async addCourse(c: Course) {
    const fofuType = this.tipoTexto('fofu');
    const inglesType = this.tipoTexto('ingles');

    // 1. Verificación de LÍMITES DE IRA (sin cambios)
    if (c.type === fofuType) {
      if (this.currentFofu + 1 > this.maxFofu) {
        const t = await this.toastCtrl.create({
          message: `¡Límite de FOFU! (IRA ${this.userIRA}). No puedes añadir más de ${this.maxFofu} asignaturas FOFU.`,
          duration: 3000, color: 'danger', position: 'top'
        });
        return t.present();
      }
    } 
    else if (c.type !== inglesType) { 
      if (this.currentCredits + c.credits > this.maxCredits) {
        const t = await this.toastCtrl.create({
          message: `¡Límite de créditos! (IRA ${this.userIRA}). No puedes añadir ${c.code} (${c.credits} créditos).
                    Total actual: ${this.currentCredits} / ${this.maxCredits}`,
          duration: 3000, color: 'danger', position: 'top'
        });
        return t.present();
      }
    }

    // 2. Verificación de "YA AÑADIDO" (sin cambios)
    if (this.horario.isAdded(c.code)) {
      const t = await this.toastCtrl.create({ message: `${c.code} ya está en tu horario`, duration: 1500, color: 'warning' });
      return t.present();
    }

    // --- MODIFICADO: Verificación de CONFLICTOS (Horario y Traslado) ---
    const res = this.horario.addFromCatalog(c.code, c.type, c.campus, c.schedule);
    
    if (!res.ok) {
      const firstError = res.error[0];
      let message = 'No se pudo agregar. Error desconocido.'; // Mensaje por defecto

      // 2A. Es un conflicto de TRASLADO
      if (firstError.type === 'transport') {
        const err = firstError as TransportConflict;
        message = `¡Conflicto de traslado! El ramo en ${err.from} (${err.day} ${err.block}) está en una sede lejana al ramo que intentas añadir en ${err.to}. El tiempo de viaje no es suficiente.`;
      
      // 2B. Es un conflicto de HORARIO (tope)
      } else if (firstError.type === 'schedule') {
        const lines = res.error
          .slice(0, 3)
          .map(e => {
            const err = e as ScheduleConflict; // Casteo al tipo correcto
            return `${err.day} ${err.block} ocupado por ${err.with}`;
          })
          .join(' · ');
        message = `No se pudo agregar. Choques: ${lines}${res.error.length > 3 ? '…' : ''}`;
      }
      
      // Muestra el Toast de error
      const t = await this.toastCtrl.create({
        message,
        duration: 4000, // Más tiempo para que se lea bien el mensaje de traslado
        color: 'danger',
        position: 'top' // Arriba para que sea más visible
      });
      return t.present();
    }
    // --- FIN DE LA MODIFICACIÓN ---

    // 3. ÉXITO (sin cambios)
    const toast = await this.toastCtrl.create({
      message: `${c.code} agregado al borrador de horario`,
      duration: 1500, position: 'bottom', color: 'success'
    });
    await toast.present();
  }
  // ==================================================================
  // ================= 👆 FIN DE LA MODIFICACIÓN 👆 ===================
  // ==================================================================

  async removeCourse(code: string) {
    const removed = this.horario.removeByCode(code);
    const t = await this.toastCtrl.create({
      message: removed ? `${code} eliminado del horario` : `${code} no estaba en tu horario`,
      duration: 1400, color: removed ? 'medium' : 'warning'
    });
    t.present();
  }

  isAdded(code: string) { return this.addedCodes.has(code); }

  // ==== Carga y helpers ====

  private calculateCurrentCounts() {
    if (!this.allCourses.length) {
      this.currentCredits = 0;
      this.currentFofu = 0;
      return;
    }

    let totalCredits = 0;
    let totalFofu = 0;
    const fofuType = this.tipoTexto('fofu');
    const inglesType = this.tipoTexto('ingles');

    for (const code of this.addedCodes) {
      const course = this.allCourses.find(c => c.code === code);
      if (course) {
        if (course.type === fofuType) {
          totalFofu++;
        } 
        else if (course.type !== inglesType) {
          totalCredits += course.credits;
        }
      }
    }
    this.currentCredits = totalCredits;
    this.currentFofu = totalFofu;
  }

  private async loadFromApi() {
    this.loading = true;
    try {
      const response = await firstValueFrom(this.api.getMiCatalogo());
      const details = response.data as AsignaturaConProgreso[];

      const list: Course[] = [];
      for (const a of details) {
        if (!a) continue;

        const approval = this.toApproval(a.tasa_aprobacion_pct, a.tasa_aprobacion);
        const tipoTxt = this.tipoTexto(a.tipo);
        const estadoValido = (a.estado === 'aprobada' || a.estado === 'reprobada') ? a.estado : 'pendiente';

        if (!a.secciones?.length) {
          list.push({
            code: a.sigla, name: a.nombre, type: tipoTxt, credits: a.creditos || 0,
            professor: '', schedule: ['Sin secciones'], campus: '', approval,
            estado: estadoValido
          });
          continue;
        }

        for (const s of a.secciones) {
          const campus = this.firstNonEmpty((s.bloques || []).map(b => b.sede || '')) || '';
          const schedule = this.makeScheduleStrings(s);
          list.push({
            code: `${a.sigla}-${s.seccion}`, name: a.nombre, type: tipoTxt,
            credits: a.creditos || 0, professor: s.docente || '', schedule, campus, approval,
            estado: estadoValido
          });
        }
      }

      this.allCourses = list;
      this.calculateCurrentCounts();

    } catch (err) {
      console.error('Error cargando el catálogo', err);
      const t = await this.toastCtrl.create({
        message: 'No se pudo cargar el catálogo de asignaturas.',
        duration: 2000,
        color: 'danger'
      });
      t.present();
    } finally {
      this.loading = false;
    }
  }

  // --- Helpers (sin cambios) ---
  private diaLabel(d: string): string {
    switch (d) {
      case 'LUN': return 'Lunes'; case 'MAR': return 'Martes'; case 'MIE': return 'Miércoles';
      case 'JUE': return 'Jueves'; case 'VIE': return 'Viernes'; case 'SAB': return 'Sábado'; default: return d;
    }
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
    if (p && /\d/.test(p)) return parseInt(p.replace('%', '').trim(), 10);
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
  private normalize(t: string) {
    return (t || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  }

  // ====== Filtro y Ordenamiento (sin cambios) ======
  get counts() {
    const out = { obligatorio: 0, fofu: 0, ingles: 0, electivo: 0 };
    for (const c of this.allCourses) {
      const t = this.normalize(c.type);
      if (t.includes('oblig')) out.obligatorio++;
      else if (t.includes('fofu')) out.fofu++;
      else if (t.includes('ingles')) out.ingles++;
      else out.electivo++;
    }
    return out;
  }
  get viewCourses(): Course[] {
    const filtered = this.filter === 'all'
      ? this.allCourses
      : this.allCourses.filter(c => {
        const t = this.normalize(c.type);
        if (this.filter === 'obligatorio') return t.includes('oblig');
        if (this.filter === 'fofu') return t.includes('fofu');
        if (this.filter === 'ingles') return t.includes('ingles');
        if (this.filter === 'electivo') return t.includes('elect') || t.includes('optat');
        return true;
      });

    return filtered.sort((a, b) => {
      if (a.estado === 'reprobada' && b.estado !== 'reprobada') return -1;
      if (a.estado !== 'reprobada' && b.estado === 'reprobada') return 1;
      return a.code.localeCompare(b.code);
    });
  }
}