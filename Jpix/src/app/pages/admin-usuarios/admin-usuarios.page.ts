import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { UsuariosAdminService, Usuario, Rol } from 'src/app/services/usuarios-admin.service';

@Component({
  selector: 'app-admin-usuarios',
  templateUrl: './admin-usuarios.page.html',
  styleUrls: ['./admin-usuarios.page.scss'],
  standalone: false,
})
export class AdminUsuariosPage {
  loading = true;
  usuarios: Usuario[] = [];

  // crear
  createOpen = false;
  createForm!: FormGroup;

  // editar
  editOpen = false;
  editForm!: FormGroup;
  editingUser: Usuario | null = null;

  constructor(
    private api: UsuariosAdminService,
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    this.createForm = this.fb.group({
      rut: ['', [Validators.required]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rol: ['estudiante' as Rol, [Validators.required]]
    });

    this.editForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      rol: ['estudiante' as Rol, [Validators.required]]
    });

    await this.load();
  }

  async load() {
    this.loading = true;
    try {
      const r = await firstValueFrom(this.api.list());
      this.usuarios = r.data || [];
    } catch (e) {
      await this.showToast('No se pudo cargar usuarios', 'danger');
    } finally {
      this.loading = false;
    }
  }

  // 👇 Handler para el refresher (evita arrow en template)
  async onRefresh(ev: any) {
    try {
      await this.load();
    } finally {
      ev?.target?.complete?.();
    }
  }

  // ======= Crear =======
  openCreate() {
    this.createForm.reset({ rut:'', nombre:'', email:'', password:'', rol:'estudiante' });
    this.createOpen = true;
  }
  closeCreate() { this.createOpen = false; }

  async saveCreate() {
    if (this.createForm.invalid) return;
    try {
      const r = await firstValueFrom(this.api.create(this.createForm.value));
      this.usuarios = [...this.usuarios, r.data];
      this.closeCreate();
      await this.showToast('Usuario creado', 'success');
    } catch (e: any) {
      if (e?.status === 409) return this.showToast('Email o RUT ya existe', 'warning');
      await this.showToast('No se pudo crear', 'danger');
    }
  }

  // ======= Editar =======
  openEdit(u: Usuario) {
    this.editingUser = u;
    this.editForm.reset({
      nombre: u.nombre,
      email: u.email,
      password: '',
      rol: u.rol
    });
    this.editOpen = true;
  }
  closeEdit() { this.editOpen = false; this.editingUser = null; }

  async saveEdit() {
    if (this.editForm.invalid || !this.editingUser) return;
    const body: any = {
      nombre: this.editForm.value.nombre,
      email: this.editForm.value.email,
      rol: this.editForm.value.rol
    };
    if (this.editForm.value.password) body.password = this.editForm.value.password;

    try {
      const r = await firstValueFrom(this.api.update(this.editingUser.id, body));
      this.usuarios = this.usuarios.map(u => u.id === r.data.id ? r.data : u);
      this.closeEdit();
      await this.showToast('Usuario actualizado', 'success');
    } catch (e: any) {
      if (e?.status === 409) return this.showToast('Email o RUT ya existe', 'warning');
      await this.showToast('No se pudo actualizar', 'danger');
    }
  }

  async toggleRole(u: Usuario) {
    const newRole: Rol = u.rol === 'admin' ? 'estudiante' : 'admin';
    try {
      const r = await firstValueFrom(this.api.update(u.id, { rol: newRole }));
      this.usuarios = this.usuarios.map(x => x.id === u.id ? r.data : x);
      await this.showToast(`Rol cambiado a ${newRole}`, 'medium');
    } catch {
      await this.showToast('No se pudo cambiar rol', 'danger');
    }
  }

  async remove(u: Usuario) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar',
      message: `¿Eliminar a <b>${u.nombre}</b>?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: async () => {
            try {
              await firstValueFrom(this.api.remove(u.id));
              this.usuarios = this.usuarios.filter(x => x.id !== u.id);
              await this.showToast('Usuario eliminado', 'success');
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

  trackById(_: number, u: Usuario) { return u.id; }
}
