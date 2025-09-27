import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Almacenamos el estado de autenticación en un BehaviorSubject para manejarlo reactivamente
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    // Al inicializar, verificamos si el usuario ya está logueado desde el localStorage
    const user = localStorage.getItem('user');
    if (user) {
      this.isAuthenticatedSubject.next(true); // Si hay usuario, estamos autenticados
    }
  }

  // Función de login
  login() {
    localStorage.setItem('user', 'authenticated');  // Guardamos el estado de autenticación
    this.isAuthenticatedSubject.next(true); // Emitimos el estado como 'loggeado'
  }

  // Función de logout
  logout() {
    localStorage.removeItem('user');  // Eliminamos el estado de autenticación
    this.isAuthenticatedSubject.next(false); // Emitimos el estado como 'no loggeado'
  }
}
