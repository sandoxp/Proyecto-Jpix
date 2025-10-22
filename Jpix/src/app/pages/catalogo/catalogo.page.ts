import { Component, OnInit } from '@angular/core'; // <--- Añadido OnInit
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HorarioService } from '../../services/horario.service';
// --- MODIFICADO: Importar AsignaturaConProgreso ---
import { AsignaturasService, Asignatura, Seccion } from '../../services/asignaturas.service';
import { ProgresoEstado, AsignaturaConProgreso } from '../../services/progreso.service'; // <-- Necesitamos el tipo

type CourseType = 'Obligatorio' | 'FoFu' | 'Electivo' | string;
type Segment = 'all' | 'obligatorio' | 'fofu' | 'ingles' | 'electivo';

interface Course {
  code: string; name: string; type: CourseType;
  credits: number; professor: string; schedule: string[];
  campus: string; approval: number;
  estado: ProgresoEstado; // <-- AÑADIDO: Para saber si está reprobada
}

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  standalone: false,
})
// --- MODIFICADO: Implementar OnInit ---
export class CatalogoPage implements OnInit {
  // Almacena TODOS los cursos cargados desde la API
  allCourses: Course[] = []; 
  loading = true;
  filter: Segment = 'all';

  // Para saber qué está agregado (des/activar botones)
  addedCodes = new Set<string>();

  constructor(
    private toastCtrl: ToastController,
    private router: Router,
    private api: AsignaturasService, // <--- El servicio que tiene getMiCatalogo
    private horario: HorarioService,
  ) { }

  // --- MODIFICADO: Usamos ngOnInit ahora ---
  async ngOnInit() {
    // Quitamos la verificación de 'user' aquí, AuthGuard ya lo hace
    // Sigue el estado del horario
    this.horario.codes$.subscribe(set => this.addedCodes = set);
    await this.loadFromApi();
  }

  // --- MODIFICADO: ionViewWillEnter ya no es necesario si usamos ngOnInit ---
  // async ionViewWillEnter() {
  //  // Sigue el estado del horario
  //  this.horario.codes$.subscribe(set => this.addedCodes = set);
  //  await this.loadFromApi();
  // }

  trackByCode(_: number, c: Course) { return c.code; }

  async addCourse(c: Course) {
    // Lógica sin cambios...
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
    // Lógica sin cambios...
        const removed = this.horario.removeByCode(code);
    const t = await this.toastCtrl.create({
      message: removed ? `${code} eliminado del horario` : `${code} no estaba en tu horario`,
      duration: 1400, color: removed ? 'medium' : 'warning'
    });
    t.present();
  }

  isAdded(code: string) { return this.addedCodes.has(code); }

  // ==== Carga y helpers ====
  
  // --- MODIFICADO: Procesar el nuevo campo 'estado' ---
  private async loadFromApi() {
    this.loading = true; // Asegurarse de mostrar loading al inicio
    try {
      // 1. Llama a getMiCatalogo. 'details' ya viene filtrado por progreso
      //    e incluye el estado ('pendiente', 'reprobada').
      //    (OJO: Asegúrate que AsignaturaService aún use Asignatura[], puede necesitar ajuste
      //     si la API ahora devuelve AsignaturaConProgreso[])
      //    ACTUALIZACIÓN: Como getMiCatalogo está en AsignaturaService, asumimos que devuelve
      //    el tipo Asignatura[] como está definido ahí. Necesitamos castear.
      const response = await firstValueFrom(this.api.getMiCatalogo());
      const details = response.data as AsignaturaConProgreso[]; // <-- Casteamos

      const list: Course[] = [];
      for (const a of details) {
        if (!a) continue; 
        
        const approval = this.toApproval(a.tasa_aprobacion_pct, a.tasa_aprobacion);
        const tipoTxt = this.tipoTexto(a.tipo);

        // Asegurarse que el estado siempre sea uno de los válidos o pendiente
        const estadoValido = (a.estado === 'aprobada' || a.estado === 'reprobada') ? a.estado : 'pendiente';

        if (!a.secciones?.length) {
          list.push({
            code: a.sigla, name: a.nombre, type: tipoTxt, credits: a.creditos || 0,
            professor: '', schedule: ['Sin secciones'], campus: '', approval,
            estado: estadoValido // <-- Añadido estado
          });
          continue;
        }

        for (const s of a.secciones) {
          const campus = this.firstNonEmpty((s.bloques || []).map(b => b.sede || '')) || '';
          const schedule = this.makeScheduleStrings(s);
          list.push({
            code: `${a.sigla}-${s.seccion}`, name: a.nombre, type: tipoTxt,
            credits: a.creditos || 0, professor: s.docente || '', schedule, campus, approval,
            estado: estadoValido // <-- Añadido estado
          });
        }
      }
      
      // Ya no necesitamos ordenar aquí, el backend lo hace
      // list.sort((x, y) => { ... }); 
      this.allCourses = list; // Guardamos la lista completa
      
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

  // --- Helpers sin cambios ---
  private diaLabel(d: string): string { /* ... sin cambios ... */ 
        switch (d) {
      case 'LUN': return 'Lunes'; case 'MAR': return 'Martes'; case 'MIE': return 'Miércoles';
      case 'JUE': return 'Jueves'; case 'VIE': return 'Viernes'; case 'SAB': return 'Sábado'; default: return d;
    }
  }
  private makeScheduleStrings(s: Seccion): string[] { /* ... sin cambios ... */ 
        const lines: string[] = [];
    for (const b of (s.bloques || [])) {
      const dia = this.diaLabel(b.dia);
      if (b.clave_ini && b.clave_fin) lines.push(`${dia} ${b.clave_ini}-${b.clave_fin}`);
      else if (b.hora_inicio && b.hora_fin) lines.push(`${dia} ${b.hora_inicio}-${b.hora_fin}`);
    }
    return lines.length ? lines : ['No tiene'];
  }
  private firstNonEmpty(arr: string[]) { /* ... sin cambios ... */ return arr.find(x => !!x && x.trim().length > 0) || ''; }
  private toApproval(p?: string | null, f?: number | null): number { /* ... sin cambios ... */ 
        if (p && /\d/.test(p)) return parseInt(p.replace('%', '').trim(), 10);
    if (typeof f === 'number') return Math.round(f * 100);
    return 0;
  }
  private tipoTexto(t?: string): 'Obligatorio' | 'FoFu' | 'Electivo' | string { /* ... sin cambios ... */ 
        switch ((t || '').toLowerCase()) {
      case 'obligatoria': return 'Obligatorio';
      case 'fofu': return 'FoFu';
      case 'ingles': return 'Inglés';
      case 'optativa': return 'Electivo';
      default: return t || '';
    }
  }

  // ====== Filtro y Ordenamiento ======
  private normalize(t: string) { /* ... sin cambios ... */ 
        return (t || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  }
  
  // --- MODIFICADO: Counts ahora usa allCourses ---
  get counts() {
    const out = { obligatorio: 0, fofu: 0, ingles: 0, electivo: 0 };
    for (const c of this.allCourses) { // <-- Usa la lista completa
      const t = this.normalize(c.type);
      if (t.includes('oblig')) out.obligatorio++;
      else if (t.includes('fofu')) out.fofu++;
      else if (t.includes('ingles')) out.ingles++;
      else out.electivo++;
    }
    return out;
  }

  // --- MODIFICADO: viewCourses ahora usa allCourses y ordena ---
  get viewCourses(): Course[] {
    // 1. Filtrar primero
    const filtered = this.filter === 'all' 
      ? this.allCourses 
      : this.allCourses.filter(c => {
          const t = this.normalize(c.type);
          if (this.filter === 'obligatorio') return t.includes('oblig');
          if (this.filter === 'fofu')        return t.includes('fofu');
          if (this.filter === 'ingles')      return t.includes('ingles');
          if (this.filter === 'electivo')    return t.includes('elect') || t.includes('optat');
          return true; // Should not happen
        });

    // 2. Ordenar después: Reprobadas primero
    return filtered.sort((a, b) => {
      if (a.estado === 'reprobada' && b.estado !== 'reprobada') return -1;
      if (a.estado !== 'reprobada' && b.estado === 'reprobada') return 1;
      // Si ambas son reprobadas o ambas pendientes, ordenar por código (ya viene ordenado por semestre desde el backend)
      return a.code.localeCompare(b.code);
    });
  }
  // --- FIN DE LA MODIFICACIÓN ---
}