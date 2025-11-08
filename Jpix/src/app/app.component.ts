import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth';// Importamos el servicio
// --- 1. IMPORTAR HorarioService ---
import { HorarioService } from './services/horario.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  isLoggedIn: boolean = false;
  loading: boolean = true;
  // (La lógica de accesibilidad ya la movimos al header)

  constructor(
    private router: Router, 
    private authService: AuthService,
    private horario: HorarioService // <-- 2. INYECTAR
  ) {}

  ngOnInit() {
    // Escucha cambios de autenticación (login/logout)
    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isLoggedIn = isAuthenticated;
      this.loading = false; // Dejamos de cargar aquí
      
      if (isAuthenticated) {
        // --- 3A. Si el usuario INICIÓ SESIÓN, cargamos su horario ---
        const user = this.authService.getUser();
        this.horario.setActiveUser(user?.id || null);
      } else {
        // --- 3B. Si el usuario CERRÓ SESIÓN, limpiamos el horario ---
        this.horario.setActiveUser(null);
        this.router.navigate(['/login']);
      }
    });

    // --- 4. MANEJAR RECARGA DE PÁGINA (F5) ---
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      // No hay usuario en localStorage, nos aseguramos de estar deslogueados
      this.authService.logout(); // Esto disparará el 'subscribe' de arriba y limpiará el horario
    } else {
      // Hay un usuario, cargamos su horario
      try {
        const userData = JSON.parse(userStr);
        this.horario.setActiveUser(userData.id); // Cargamos el horario del usuario del F5
        this.isLoggedIn = true; // Sincronizar estado
      } catch (e) {
        console.error('Error al parsear usuario, deslogueando', e);
        this.authService.logout(); // Error, mejor desloguear
      }
    }
  }

  // (Tu función logout() se mantiene igual)
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}