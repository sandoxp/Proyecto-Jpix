// src/app/pages/registro/registro.page.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth'; // 👈 importa tu servicio real de auth
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: false,
})
export class RegistroPage {
  email: string = '';
  username: string = '';
  documentType: string = 'rut'; // 'rut' o 'pasaporte'
  rut: string = '';
  passport: string = '';
  country: string = '';
  comuna: string = '';
  phone: string = '';
  password: string = '';
  confirmPassword: string = '';
  termsAccepted: boolean = false;

  loading = false;

  constructor(private router: Router, private auth: AuthService) {} // 👈 inyecta AuthService

  register() {
    // Validaciones básicas
    if (this.password !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    if (!this.termsAccepted) {
      alert('Debes aceptar los términos y condiciones');
      return;
    }
    if (!this.email || !this.username || !this.password) {
      alert('Por favor, completa email, usuario y contraseña');
      return;
    }
    if (this.documentType === 'rut' && !this.rut) {
      alert('Por favor, ingresa tu RUT');
      return;
    }

    // Payload para el backend (usa /auth/register)
    const body = {
      rut: this.documentType === 'rut' ? this.rut : 'SIN-RUT',
      nombre: this.username,
      email: this.email,
      password: this.password,
      rol: 'estudiante' as 'estudiante' | 'admin' // por defecto
    };

    this.loading = true;

    // 👇 AQUÍ va la llamada que te pasé
   this.auth.register(body).subscribe({
      next: () => {
        this.loading = false;
        alert('Registro exitoso, inicia sesión');
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 409) {
          alert('Ya tienes cuenta, inicia sesión');
          this.router.navigate(['/login']);
          return;
        }
        alert(err.error?.error?.message || 'No se pudo registrar');
      }
    });
  }
}
