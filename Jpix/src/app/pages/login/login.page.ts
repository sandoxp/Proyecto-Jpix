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
  // 👇 usar SIEMPRE 'admin' | 'estudiante'
  role: 'estudiante' | 'admin' = 'estudiante';

  email = '';      // para admin (o puedes seguir usando "usuario" si prefieres)
  rut = '';        // para estudiante o admin por rut
  password = '';

  loading = false;

  constructor(private router: Router, private auth: AuthService) {}

  login() {
    if (!this.password) return alert('Ingresa tu contraseña');

    // Construimos el payload según el rol
    const payload: any = { password: this.password };

    if (this.role === 'estudiante') {
      if (!this.rut) return alert('Ingresa tu RUT');
      payload.rut = this.rut.trim();
    } else {
      // ADMIN: permite email o rut
      const maybe = (this.email || this.rut || '').trim();
      if (!maybe) return alert('Ingresa email o RUT');
      if (/\S+@\S+\.\S+/.test(maybe)) payload.email = maybe;
      else payload.rut = maybe;
    }

    this.loading = true;
    this.auth.loginWithCredentials(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        alert(err?.error?.error?.message || 'Credenciales inválidas');
      }
    });
  }
}
