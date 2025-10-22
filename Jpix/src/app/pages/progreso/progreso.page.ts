import { Component, OnInit } from '@angular/core';
import { ActionSheetController, ToastController } from '@ionic/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
// --- MODIFICADO: Ya no importamos 'ProgresoEstado' porque lo definimos aquí ---
import { ProgresoService, AsignaturaConProgreso } from '../../services/progreso.service';

// --- MODIFICADO: Definimos los estados válidos aquí, sin 'cursando' ---
type ProgresoEstado = 'pendiente' | 'aprobada' | 'reprobada';

// Tipo para la estructura de datos agrupada
interface SemestreAgrupado {
  numero: number | string;
  asignaturas: AsignaturaConProgreso[];
}

@Component({
  selector: 'app-progreso',
  templateUrl: './progreso.page.html',
  styleUrls: ['./progreso.page.scss'],
  standalone: false,
})
export class ProgresoPage implements OnInit {

  // Almacena la lista plana de la API
  private todasAsignaturas: AsignaturaConProgreso[] = [];
  
  // Almacena la lista agrupada para la vista
  public semestres: SemestreAgrupado[] = [];
  
  public loading = true;
  public error: string | null = null;

  // --- AÑADIDO: Para manejar el acordeón ---
  public openSemestres = new Set<number | string>();

  constructor(
    private progresoService: ProgresoService,
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    // No cargamos datos aquí, usamos ionViewWillEnter
  }

  // Se ejecuta CADA VEZ que el usuario entra a la página
  ionViewWillEnter() {
    this.cargarProgreso();
  }

  async cargarProgreso() {
    this.loading = true;
    this.error = null;
    // --- MODIFICADO: Limpiamos el set al cargar ---
    this.openSemestres.clear(); 

    try {
      const { data } = await firstValueFrom(this.progresoService.getProgreso());
      this.todasAsignaturas = data;
      this.agruparPorSemestre();

      // --- AÑADIDO: Abrir el primer semestre por defecto ---
      if (this.semestres.length > 0) {
        this.openSemestres.add(this.semestres[0].numero);
      }
      
    } catch (err) {
      console.error(err);
      this.error = 'Error al cargar tu progreso. Intenta más tarde.';
      if (err instanceof HttpErrorResponse) {
        this.error = err.error?.error?.message || this.error;
      }
    } finally {
      this.loading = false;
    }
  }

  private agruparPorSemestre() {
    const grupos = new Map<number | string, AsignaturaConProgreso[]>();

    for (const asig of this.todasAsignaturas) {
      // 1. Determinar la llave de agrupación
      let key: number | string;
      if (asig.periodo_malla) {
        key = asig.periodo_malla;
      } else {
        // Agrupar FOFU, Inglés, etc. por su tipo
        switch (asig.tipo) {
          case 'fofu': key = 'FOFU'; break;
          case 'ingles': key = 'Inglés'; break;
          case 'optativa': key = 'Optativas'; break;
          default: key = 'Otros';
        }
      }

      // 2. Añadir al grupo
      if (!grupos.has(key)) {
        grupos.set(key, []);
      }
      grupos.get(key)!.push(asig);
    }

    // 3. Convertir el Map a un Array y ordenarlo
    this.semestres = Array.from(grupos.entries())
      .map(([numero, asignaturas]) => ({ numero, asignaturas }))
      .sort((a, b) => {
        // Ordenar: Semestres numéricos primero, luego alfabéticos
        if (typeof a.numero === 'number' && typeof b.numero === 'number') {
          return a.numero - b.numero; // 1, 2, 3...
        }
        if (typeof a.numero === 'number') return -1; // Números antes que strings
        if (typeof b.numero === 'number') return 1;  // Strings después de números
        return String(a.numero).localeCompare(String(b.numero)); // FOFU, Inglés...
      });
  }

  // Helper para el template HTML
  esNumero(valor: any): valor is number {
    return typeof valor === 'number';
  }

  // --- AÑADIDO: Función para el acordeón ---
  toggleSemestre(numero: number | string) {
    if (this.openSemestres.has(numero)) {
      this.openSemestres.delete(numero);
    } else {
      this.openSemestres.add(numero);
    }
  }
  // --- FIN DE LO AÑADIDO ---


  // Muestra el popup para cambiar el estado de un ramo
  async abrirSelectorDeEstado(asignatura: AsignaturaConProgreso) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: `${asignatura.sigla} - ${asignatura.nombre}`,
      buttons: [
        {
          text: 'Aprobada',
          icon: 'checkmark-circle',
          handler: () => this.actualizarProgreso(asignatura, 'aprobada')
        },
        // --- BOTÓN ELIMINADO ---
        // {
        //   text: 'Cursando',
        //   icon: 'pencil',
        //   handler: () => this.actualizarProgreso(asignatura, 'cursando')
        // },
        // --- FIN DE LA ELIMINACIÓN ---
        {
          text: 'Reprobada',
          icon: 'close-circle',
          handler: () => this.actualizarProgreso(asignatura, 'reprobada')
        },
        {
          text: 'Pendiente',
          icon: 'ellipse-outline',
          handler: () => this.actualizarProgreso(asignatura, 'pendiente')
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  // Llama a la API para guardar el nuevo estado
  private async actualizarProgreso(asignatura: AsignaturaConProgreso, nuevoEstado: ProgresoEstado) {
    const estadoAnterior = asignatura.estado;
    
    // 1. Actualizar la UI inmediatamente (Optimistic Update)
    asignatura.estado = nuevoEstado;

    try {
      // 2. Llamar a la API
      await firstValueFrom(this.progresoService.updateProgreso(asignatura.sigla, nuevoEstado));
      
      // 3. Mostrar Toast de éxito
      this.mostrarToast(`'${asignatura.sigla}' marcada como ${nuevoEstado}.`, 'success');

    } catch (err) {
      // 4. Revertir el cambio en la UI si la API falla
      asignatura.estado = estadoAnterior;
      console.error('Error al actualizar progreso:', err);
      this.mostrarToast('Error al guardar el cambio.', 'danger');
    }
  }

  // Helper para mostrar notificaciones
  private async mostrarToast(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}