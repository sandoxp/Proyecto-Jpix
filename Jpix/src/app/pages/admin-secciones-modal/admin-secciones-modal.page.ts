import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, AlertController, ToastController, NavParams } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { Asignatura, Seccion } from 'src/app/services/asignaturas.service';
import { SeccionesService, SeccionPayload } from 'src/app/services/secciones.service';

@Component({
  selector: 'app-admin-secciones-modal',
  templateUrl: './admin-secciones-modal.page.html',
  styleUrls: ['./admin-secciones-modal.page.scss'],
  standalone: false,
})
export class AdminSeccionesModalPage implements OnInit {

  @Input() asignatura!: Asignatura;
  secciones: Seccion[] = [];
  loading = true;
  createOpen = false;
  editOpen = false;
  editingSeccion: Seccion | null = null;
  createForm!: FormGroup;
  editForm!: FormGroup;
  dias = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

  constructor(
    private modalCtrl: ModalController,
    private navParams: NavParams,
    private api: SeccionesService,
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    this.asignatura = this.navParams.get('asignatura');
  }

  ngOnInit() {
    this.createForm = this.fb.group({
      seccion: ['', Validators.required],
      docente: [''],
      bloques: this.fb.array([
        this.crearBloqueFormGroup()
      ])
    });

    this.editForm = this.fb.group({
      seccion: ['', Validators.required],
      docente: [''],
      bloques: this.fb.array([])
    });

    this.loadSecciones();
  }

  async loadSecciones() {
    this.loading = true;
    try {
      const r = await firstValueFrom(this.api.list(this.asignatura.id));
      this.secciones = r.data || [];
    } catch (e) {
      this.showToast('No se pudo cargar secciones', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async onRefresh(ev: any) {
    try {
      await this.loadSecciones();
    } finally {
      ev?.target?.complete?.();
    }
  }

  // --- Helpers para el FormArray de Bloques ---
  crearBloqueFormGroup(): FormGroup {
    // --- 👇 AQUÍ ESTÁ LA CORRECCIÓN 2 👇 ---
    return this.fb.group({
      dia: ['LUN', Validators.required],
      clave_ini: [null, Validators.required], // <-- AÑADIDO
      clave_fin: [null, Validators.required], // <-- AÑADIDO
      hora_inicio: ['', Validators.required],
      hora_fin: ['', Validators.required],
      sede: ['', Validators.required],
      sala: ['', Validators.required]
    });
  }

  get createBloques() {
    return this.createForm.get('bloques') as FormArray;
  }
  get editBloques() {
    return this.editForm.get('bloques') as FormArray;
  }

  addBloque(form: FormGroup) {
    (form.get('bloques') as FormArray).push(this.crearBloqueFormGroup());
  }
  removeBloque(form: FormGroup, index: number) {
    (form.get('bloques') as FormArray).removeAt(index);
  }

  // ======= Crear Sección =======
  openCreate() {
    this.createForm.reset({ seccion: '', docente: '' });
    this.createBloques.clear();
    this.addBloque(this.createForm);
    this.createOpen = true;
  }
  closeCreate() { this.createOpen = false; }

  async saveCreate() {
    if (this.createForm.invalid) {
      return this.showToast('Formulario inválido', 'warning');
    }
    const payload: SeccionPayload = {
      ...this.createForm.value,
      asignatura_id: this.asignatura.id
    };
    try {
      const r = await firstValueFrom(this.api.create(payload));
      this.secciones = [...this.secciones, r.data];
      this.closeCreate();
      this.showToast('Sección creada', 'success');
    } catch (e) {
      this.showToast('No se pudo crear la sección', 'danger');
    }
  }

  // ======= Editar Sección =======
  openEdit(s: Seccion) {
    this.editingSeccion = s;
    this.editBloques.clear();
    
    // --- 👇 AQUÍ ESTÁ LA CORRECCIÓN 3 👇 ---
    s.bloques?.forEach(b => {
      this.editBloques.push(this.fb.group({
        dia: [b.dia, Validators.required],
        clave_ini: [b.clave_ini, Validators.required], // <-- AÑADIDO
        clave_fin: [b.clave_fin, Validators.required], // <-- AÑADIDO
        hora_inicio: [b.hora_inicio, Validators.required],
        hora_fin: [b.hora_fin, Validators.required],
        sede: [b.sede, Validators.required],
        sala: [b.sala, Validators.required]
      }));
    });

    this.editForm.patchValue({
      seccion: s.seccion,
      docente: s.docente,
    });
    this.editOpen = true;
  }
  
  closeEdit() { this.editOpen = false; this.editingSeccion = null; }

  async saveEdit() {
    if (this.editForm.invalid || !this.editingSeccion) return;
    const payload: Partial<SeccionPayload> = {
      ...this.editForm.value,
      asignatura_id: this.asignatura.id
    };
    try {
      const r = await firstValueFrom(this.api.update(this.editingSeccion.id, payload));
      this.secciones = this.secciones.map(s => s.id === r.data.id ? r.data : s);
      this.closeEdit();
      this.showToast('Sección actualizada', 'success');
    } catch (e) {
      this.showToast('No se pudo actualizar', 'danger');
    }
  }

  // ======= Eliminar Sección =======
  async remove(s: Seccion) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar',
      message: `¿Eliminar <b>Sección ${s.seccion}</b> de ${this.asignatura.sigla}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive',
          handler: async () => {
            try {
              await firstValueFrom(this.api.remove(s.id));
              this.secciones = this.secciones.filter(x => x.id !== s.id);
              this.showToast('Sección eliminada', 'success');
            } catch {
              this.showToast('No se pudo eliminar', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  dismissModal() {
    this.modalCtrl.dismiss();
  }

  async showToast(message: string, color: string = 'primary') {
    const t = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }

  trackById(_: number, s: Seccion) { return s.id; }
}