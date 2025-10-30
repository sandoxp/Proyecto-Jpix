import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth'; // 👈 SE IMPORTA AUTHSERVICE
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// --- MODIFICADO: Añadido 'ira' ---
interface UserProfile {
  id: number;
  nombre: string;
  rut: string;
  email: string;
  carrera: string | null;
  periodo_malla: number | null;
  rol: 'estudiante' | 'admin';
  ira: 'bajo' | 'medio' | 'alto'; // <-- AÑADIDO
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false,
})
export class PerfilPage implements OnInit {
  
  profile: UserProfile | null = null; 
  editOpen = false;
  form: FormGroup;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private nav: NavController,
    private toastCtrl: ToastController,
    private router: Router,
    private auth: AuthService
  ) {
    // --- MODIFICADO: Añadido 'ira' al formulario ---
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      rut: [{ value: '', disabled: true }, [Validators.required]],
      carrera: ['', [Validators.required]],
      periodo_malla: [null, [Validators.required, Validators.min(1)]],
      email: ['', [Validators.required, Validators.email]],
      ira: [null, [Validators.required]], // <-- AÑADIDO
    });
  }

  ngOnInit() {
    this.loadProfileData();
  }

  loadProfileData() {
    // --- MODIFICADO: Usamos el nuevo método del AuthService ---
    this.profile = this.auth.getUser() as UserProfile | null;

    if (!this.profile) {
      this.showToast('Sesión no encontrada, por favor inicia sesión', 'danger');
      this.router.navigate(['/login']);
      return;
    }
    
    // Rellenamos el formulario con los datos reales cargados
    this.form.reset({
      nombre: this.profile.nombre,
      rut: this.profile.rut,
      carrera: this.profile.carrera,
      periodo_malla: this.profile.periodo_malla,
      email: this.profile.email,
      ira: this.profile.ira, // <-- AÑADIDO
    });
  }

  openEdit() {
    // Reseteamos el formulario al estado actual
    this.form.reset({
      nombre: this.profile?.nombre,
      rut: this.profile?.rut,
      carrera: this.profile?.carrera,
      periodo_malla: this.profile?.periodo_malla,
      email: this.profile?.email,
      ira: this.profile?.ira, // <-- AÑADIDO
    });
    this.editOpen = true;
  }

  closeEdit() {
    this.editOpen = false;
  }

  // --- FUNCIÓN SAVE() MODIFICADA ---
  async save() {
    if (this.form.invalid || !this.profile) return;
    this.isSaving = true;

    // --- MODIFICADO: Añadimos 'ira' al body ---
    const { nombre, email, carrera, periodo_malla, ira } = this.form.value;
    const body = { nombre, email, carrera, periodo_malla, ira };

    try {
      // 1. Llamamos a 'updateSelf'
      const response = await firstValueFrom(this.auth.updateSelf(body));
      
      // 2. Actualizamos el perfil local con la respuesta
      // (El auth.service ya actualizó el localStorage)
      this.profile = response.data.user; 
      
      this.showToast('Perfil actualizado exitosamente', 'success');
      this.closeEdit();

      // --- AÑADIDO: Recargar la página ---
      // Forzamos un reload para que el resto de la app (catalogo)
      // consulte el nuevo estado del usuario.
      // Si el token fue invalidado, esto redirigirá al login.
      // Si no, simplemente refrescará la app con el nuevo localStorage.
      window.location.reload();

    } catch (err: any) {
      const error = err as HttpErrorResponse;
      let message = 'Error desconocido al guardar';
      if (error?.status === 409) {
        message = 'El email ya está en uso por otra cuenta';
      } else if (error?.status === 400) {
        message = error.error?.error?.message || 'Datos inválidos';
      }
      this.showToast(message, 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  async showToast(message: string, color: string = 'primary') {
    const t = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }

  goBack() {
    this.nav.back();
  }
}