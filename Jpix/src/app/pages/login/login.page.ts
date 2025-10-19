// src/app/pages/login/login.page.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  role: 'estudiante' | 'administrador' = 'estudiante';
  email = '';     // opcional si lo prefieres explícito
  usuario = '';   // en tu UI, úsalo como EMAIL para admin
  rut = '';
  password = '';

  loading = false;

  constructor(private router: Router, private auth: AuthService) {}

  login() {
    if (!this.password) return alert('Ingresa tu contraseña');

    const payload: any = { password: this.password, role: this.role };

    if (this.role === 'estudiante') {
      // Login por RUT
      if (!this.rut) return alert('Ingresa tu RUT');
      payload.rut = this.rut.trim();
    } else {
      // ADMIN: permite login por EMAIL o por RUT
      const maybeEmail = (this.usuario || '').trim();   // ← Tu input "Usuario" úsalo como email
      const isEmail = /\S+@\S+\.\S+/.test(maybeEmail);

      if (isEmail) {
        payload.email = maybeEmail;
      } else if (this.rut) {
        payload.rut = this.rut.trim();
      } else {
        return alert('Ingresa email (recomendado) o RUT para administrador');
      }
    }

    this.loading = true;
    this.auth.loginWithCredentials(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        const msg = err?.error?.error?.message || 'Credenciales inválidas';
        alert(msg);
      }
    });
  }
}
