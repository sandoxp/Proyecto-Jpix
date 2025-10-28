import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth';// Importamos el servicio

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  isLoggedIn: boolean = false;  // Estado de autenticación
  loading: boolean = true; // Variable para controlar el estado de carga
  isDarkMode = false;
  isColorblindMode = false; // 1. Variable para modo daltónico

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    // Nos suscribimos al servicio de autenticación
    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isLoggedIn = isAuthenticated;
      this.loading = false; // Dejamos de estar en estado de carga
    });

    // Verificamos si el usuario está logueado al iniciar la app
    const user = localStorage.getItem('user');
    if (!user) {
      this.router.navigate(['/login']);
    } else {
      this.isLoggedIn = true;
    }

    // 2. Cargar preferencias de tema desde localStorage al iniciar
    this.checkDarkMode();
    this.checkColorblindMode();
  }

  // 3. Función para cargar y aplicar modo oscuro
  checkDarkMode() {
    // Obtenemos preferencia de localStorage.
    const storedValue = localStorage.getItem('darkMode');
    // Si no hay valor guardado, usamos 'false' como default
    this.isDarkMode = storedValue === 'true';
    document.body.classList.toggle('dark', this.isDarkMode);
  }

  // 4. Función para cargar y aplicar modo daltónico
  checkColorblindMode() {
    // Obtenemos preferencia de localStorage.
    const storedValue = localStorage.getItem('colorblindMode');
    this.isColorblindMode = storedValue === 'true';
    document.body.classList.toggle('colorblind', this.isColorblindMode);
  }

  toggleDarkMode(){
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark', this.isDarkMode);
    // 5. Guardar preferencia en localStorage
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  // 6. Nueva función para modo daltónico
  toggleColorblindMode() {
    this.isColorblindMode = !this.isColorblindMode;
    document.body.classList.toggle('colorblind', this.isColorblindMode);
    // 7. Guardar preferencia en localStorage
    localStorage.setItem('colorblindMode', this.isColorblindMode.toString());
  }

  // Función para hacer logout
  logout() {
    this.authService.logout(); // Usamos el servicio de autenticación para hacer logout
    this.router.navigate(['/login']);
  }
}