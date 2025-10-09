import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Estado de autenticación
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Estado del rol del usuario (Estudiante o Administrador)
  private roleSubject = new BehaviorSubject<string>('estudiante'); // Valor predeterminado
  role$ = this.roleSubject.asObservable();

  constructor() {
    const user = localStorage.getItem('user');
    const role = localStorage.getItem('role'); // Traemos el rol del localStorage

    if (user && role) {
      this.isAuthenticatedSubject.next(true);
      this.roleSubject.next(role); // Cargamos el rol desde el localStorage
    }
  }

  // Función de login
  login(role: string) {
    localStorage.setItem('user', 'authenticated');
    localStorage.setItem('role', role); // Guardamos el rol en el localStorage
    this.isAuthenticatedSubject.next(true);
    this.roleSubject.next(role); // Emitimos el rol
  }

  // Función de logout
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('role'); // Limpiamos el rol
    this.isAuthenticatedSubject.next(false);
    this.roleSubject.next(''); // Limpiamos el rol
  }
}
