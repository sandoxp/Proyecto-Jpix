import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

interface Perfil {
  nombre: string;
  rut: string;
  carrera: string;
  anioIngreso: number | string;
  celular: string;
  email: string;
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false,
})
export class PerfilPage {
  profile: Perfil = {
    nombre: 'XXXX XXXX XXXX',
    rut: '12.345.678-9',
    carrera: 'Ingeniería en Informática',
    anioIngreso: 2023,
    celular: '+56912345678',
    email: 'xxxxxx@gmail.com'
  };

  editOpen = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private nav: NavController,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    this.form = this.fb.group({
      nombre: [this.profile.nombre, [Validators.required, Validators.minLength(3)]],
      rut: [this.profile.rut, [Validators.required]],
      carrera: [this.profile.carrera, [Validators.required]],
      anioIngreso: [this.profile.anioIngreso, [Validators.required, Validators.min(1900)]],
      celular: [this.profile.celular, [Validators.required]],
      email: [this.profile.email, [Validators.required, Validators.email]],
    });
  }

  ngOnInit() {
    // Verificar si el usuario está logueado
    const user = localStorage.getItem('user');  // Verifica si 'user' está en localStorage

    if (!user) {
      // Si no está logueado, redirigir al login
      this.router.navigate(['/login']);
    }
  }
  openEdit() {
    this.form.reset({ ...this.profile });
    this.editOpen = true;
  }

  closeEdit() {
    this.editOpen = false;
  }

  async save() {
    if (this.form.invalid) return;

    this.profile = { ...this.form.value };

    const toast = await this.toastCtrl.create({
      message: 'Perfil actualizado',
      duration: 1400,
      position: 'bottom'
    });
    await toast.present();

    this.closeEdit();
  }

  goBack() {
    this.nav.back();
  }
}
