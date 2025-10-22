import { Component, OnInit } from '@angular/core'; // 👈 Se añade OnInit
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth'; // 👈 SE IMPORTA AUTHSERVICE
import { HttpErrorResponse } from '@angular/common/http'; // 👈 Se importa HttpErrorResponse
import { firstValueFrom } from 'rxjs'; // 👈 Se importa firstValueFrom

// Esta interfaz debe coincidir con los datos del usuario en el localStorage
interface UserProfile {
  id: number;
  nombre: string;
  rut: string;
  email: string;
  carrera: string | null;
  periodo_malla: number | null;
  rol: 'estudiante' | 'admin';
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false,
})
export class PerfilPage implements OnInit { // 👈 Se implementa OnInit
  
  // El perfil se cargará desde localStorage, no estará "por default"
  profile: UserProfile | null = null; 

  editOpen = false;
  form: FormGroup;
  isSaving = false; // Para deshabilitar el botón al guardar

  constructor(
    private fb: FormBuilder,
    private nav: NavController,
    private toastCtrl: ToastController,
    private router: Router,
    private auth: AuthService // 👈 SE INYECTA AUTHSERVICE
  ) {
    // Inicializamos el formulario con los campos que SÍ existen
    // 'celular' y 'anioIngreso' se quitan porque no están en tu modelo de BD
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      rut: [{ value: '', disabled: true }, [Validators.required]], // RUT no se puede editar
      carrera: ['', [Validators.required]],
      periodo_malla: [null, [Validators.required, Validators.min(1)]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit() {
    // Esta función se ejecuta al cargar la página
    this.loadProfileData();
  }

  // Carga los datos del usuario desde localStorage
  loadProfileData() {
    const userString = localStorage.getItem('user'); 

    if (!userString) {
      // Si no hay usuario, redirigir al login
      this.showToast('Sesión no encontrada, por favor inicia sesión', 'danger');
      this.router.navigate(['/login']);
      return;
    }

    try {
      this.profile = JSON.parse(userString) as UserProfile;
      
      // Rellenamos el formulario con los datos reales cargados
      this.form.reset({
        nombre: this.profile.nombre,
        rut: this.profile.rut,
        carrera: this.profile.carrera,
        periodo_malla: this.profile.periodo_malla,
        email: this.profile.email,
      });

    } catch (e) {
      console.error('Error parseando usuario de localStorage', e);
      this.auth.logout();
      this.router.navigate(['/login']);
    }
  }

  openEdit() {
    // Reseteamos el formulario al estado actual (por si canceló antes)
    this.form.reset({
      nombre: this.profile?.nombre,
      rut: this.profile?.rut,
      carrera: this.profile?.carrera,
      periodo_malla: this.profile?.periodo_malla,
      email: this.profile?.email,
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

    // Solo enviamos los campos que se pueden cambiar
    const { nombre, email, carrera, periodo_malla } = this.form.value;
    const body = { nombre, email, carrera, periodo_malla };

    try {
      // 1. Llamamos al método 'updateSelf' que está en auth.ts
      //    Este método llama al endpoint PUT /api/v1/usuarios/me
      const response = await firstValueFrom(this.auth.updateSelf(body));
      
      // 2. Actualizamos el perfil local con la respuesta del backend
      this.profile = response.data.user; 
      
      // 3. (IMPORTANTE) auth.updateSelf ya actualizó el localStorage

      this.showToast('Perfil actualizado exitosamente', 'success');
      this.closeEdit();

    } catch (err: any) {
      const error = err as HttpErrorResponse;
      let message = 'Error desconocido al guardar';
      if (error?.status === 409) {
        message = 'El email ya está en uso por otra cuenta';
      }
      this.showToast(message, 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  // Función de ayuda para mostrar mensajes
  async showToast(message: string, color: string = 'primary') {
    const t = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }

  goBack() {
    this.nav.back();
  }
}