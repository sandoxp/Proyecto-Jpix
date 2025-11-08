import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, AlertController, ToastController, NavParams } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { Asignatura } from 'src/app/services/asignaturas.service';
// --- Importamos el nuevo servicio ---
import { RequisitosService, Requisito, RequisitoPayload } from 'src/app/services/requisitos.service';

@Component({
  selector: 'app-admin-requisitos-modal',
  templateUrl: './admin-requisitos-modal.page.html',
  styleUrls: ['./admin-requisitos-modal.page.scss'],
  standalone: false
})
export class AdminRequisitosModalPage implements OnInit {

  @Input() asignatura!: Asignatura;
  requisitos: Requisito[] = [];
  loading = true;

  createForm!: FormGroup;

  constructor(
    private modalCtrl: ModalController,
    private navParams: NavParams,
    private api: RequisitosService, // <-- Usamos el nuevo servicio
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    this.asignatura = this.navParams.get('asignatura');
  }

  ngOnInit() {
    // Formulario para añadir un nuevo requisito
    this.createForm = this.fb.group({
      // El admin solo necesita escribir la sigla que se requiere
      requiere_sigla: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}\d{3}$/)]]
    });
    this.loadRequisitos();
  }

  async loadRequisitos() {
    this.loading = true;
    try {
      // Listamos usando la SIGLA de la asignatura
      const r = await firstValueFrom(this.api.list(this.asignatura.sigla));
      this.requisitos = r.data || [];
    } catch (e) {
      this.showToast('No se pudo cargar requisitos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async onRefresh(ev: any) {
    try {
      await this.loadRequisitos();
    } finally {
      ev?.target?.complete?.();
    }
  }

  // --- CRUD ---
  async saveCreate() {
    if (this.createForm.invalid) {
      return this.showToast('Debe ingresar una sigla válida (ej. INF100)', 'warning');
    }
    
    const payload: RequisitoPayload = {
      asignatura_sigla: this.asignatura.sigla,
      requiere_sigla: this.createForm.value.requiere_sigla.toUpperCase()
    };

    try {
      const r = await firstValueFrom(this.api.create(payload));
      this.requisitos = [...this.requisitos, r.data];
      this.createForm.reset(); // Limpiamos el formulario
      this.showToast('Requisito añadido', 'success');
    } catch (e: any) {
      if (e?.status === 409) return this.showToast('El requisito ya existe', 'warning');
      if (e?.status === 404) return this.showToast('La sigla ingresada no existe', 'warning');
      this.showToast('No se pudo añadir el requisito', 'danger');
    }
  }

  async remove(req: Requisito) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Requisito',
      message: `¿Quitar a <b>${req.requerida.sigla}</b> como requisito de ${this.asignatura.sigla}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Quitar', role: 'destructive',
          handler: async () => {
            try {
              // Usamos el ID de la fila del requisito
              await firstValueFrom(this.api.remove(req.id));
              this.requisitos = this.requisitos.filter(x => x.id !== req.id);
              this.showToast('Requisito eliminado', 'success');
            } catch {
              this.showToast('No se pudo eliminar', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // --- Controles del Modal ---
  dismissModal() {
    this.modalCtrl.dismiss();
  }

  async showToast(message: string, color: string = 'primary') {
    const t = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }
  
  trackById(_: number, r: Requisito) { return r.id; }
}