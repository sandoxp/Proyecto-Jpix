import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ToastController, ModalController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AsignaturasService, Asignatura, AsignaturaPayload } from 'src/app/services/asignaturas.service';

// --- Importamos los DOS modales ---
import { AdminSeccionesModalPage } from 'src/app/pages/admin-secciones-modal/admin-secciones-modal.page';
import { AdminRequisitosModalPage } from 'src/app/pages/admin-requisitos-modal/admin-requisitos-modal.page'; // <-- AÑADIDO

@Component({
  selector: 'app-admin-asignaturas',
  templateUrl: './admin-asignaturas.page.html',
  styleUrls: ['./admin-asignaturas.page.scss'],
  standalone: false, 
})
export class AdminAsignaturasPage implements OnInit {
  loading = true;
  asignaturas: Asignatura[] = [];
  createOpen = false;
  createForm!: FormGroup;
  editOpen = false;
  editForm!: FormGroup;
  editingAsignatura: Asignatura | null = null;

  constructor(
    private api: AsignaturasService,
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.createForm = this.fb.group({
      sigla: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}\d{3}$/)]],
      nombre: ['', [Validators.required, Validators.minLength(5)]],
      creditos: [null, [Validators.required, Validators.min(1)]],
      periodo_malla: [null],
      tipo: ['obligatoria', [Validators.required]]
    });
    this.editForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(5)]],
      creditos: [null, [Validators.required, Validators.min(1)]],
      periodo_malla: [null],
      tipo: ['obligatoria', [Validators.required]]
    });
    this.load();
  }

  async load() {
    this.loading = true;
    try {
      const r = await firstValueFrom(this.api.list());
      this.asignaturas = r.data || [];
    } catch (e) { await this.showToast('No se pudo cargar asignaturas', 'danger'); } 
    finally { this.loading = false; }
  }

  async onRefresh(ev: any) {
    try { await this.load(); } 
    finally { ev?.target?.complete?.(); }
  }


  // ======= Crear =======
  openCreate() {
    this.createForm.reset({ sigla:'', nombre:'', creditos: null, periodo_malla: null, tipo:'obligatoria' });
    this.createOpen = true;
  }
  closeCreate() { this.createOpen = false; }
  async saveCreate() {
    if (this.createForm.invalid) return;
    try {
      const payload: AsignaturaPayload = this.createForm.value;
      const r = await firstValueFrom(this.api.create(payload));
      this.asignaturas = [...this.asignaturas, r.data];
      this.closeCreate();
      await this.showToast('Asignatura creada', 'success');
    } catch (e: any) {
      if (e?.status === 409) return this.showToast('La sigla ya existe', 'warning');
      await this.showToast('No se pudo crear', 'danger');
    }
  }

  // ======= Editar =======
  openEdit(a: Asignatura) {
    this.editingAsignatura = a;
    this.editForm.reset({
      nombre: a.nombre,
      creditos: a.creditos,
      periodo_malla: a.periodo_malla,
      tipo: a.tipo
    });
    this.editOpen = true;
  }
  closeEdit() { this.editOpen = false; this.editingAsignatura = null; }
  async saveEdit() {
    if (this.editForm.invalid || !this.editingAsignatura) return;
    const sigla = this.editingAsignatura.sigla;
    const body: Partial<AsignaturaPayload> = this.editForm.value;
    try {
      const r = await firstValueFrom(this.api.update(sigla, body));
      this.asignaturas = this.asignaturas.map(a => a.sigla === sigla ? r.data : a);
      await this.showToast('Asignatura actualizada', 'success');
    } catch (e: any) {
      await this.showToast('No se pudo actualizar', 'danger');
    }
  }

  // ======= Eliminar =======
  async remove(a: Asignatura) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar',
      message: `¿Eliminar <b>${a.sigla} - ${a.nombre}</b>?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: async () => {
            try {
              await firstValueFrom(this.api.remove(a.sigla));
              this.asignaturas = this.asignaturas.filter(x => x.sigla !== a.sigla);
              await this.showToast('Asignatura eliminada', 'success');
            } catch {
              await this.showToast('No se pudo eliminar', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async showToast(message: string, color: string = 'primary') {
    const t = await this.toastCtrl.create({ message, duration: 1500, color, position: 'bottom' });
    await t.present();
  }
  trackBySigla(_: number, a: Asignatura) { return a.sigla; }

  // --- Función (Paso 2) ---
  async openSeccionesManager(asignatura: Asignatura | null) {
    if (!asignatura) return;
    const modal = await this.modalCtrl.create({
      component: AdminSeccionesModalPage,
      componentProps: { 'asignatura': asignatura }
    });
    await modal.present();
  }

  // ===============================================
  // --- FUNCIÓN NUEVA (PASO 4.4) ---
  // ===============================================
  async openRequisitosManager(asignatura: Asignatura | null) {
    if (!asignatura) return;
    
    const modal = await this.modalCtrl.create({
      component: AdminRequisitosModalPage, // <-- Llamamos al nuevo modal
      componentProps: {
        'asignatura': asignatura 
      }
    });
    await modal.present();
  }
}