import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    // Verificar si el usuario está logueado
    const isLoggedIn = !!localStorage.getItem('user'); // Verifica si 'user' está en localStorage

    if (isLoggedIn) {
      // Si está logueado, permitir el acceso
      return true;
    } else {
      // Si no está logueado, redirigir al login
      this.router.navigate(['/login']);
      return false;
    }
  }
}
