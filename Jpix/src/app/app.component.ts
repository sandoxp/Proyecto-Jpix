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
  isLoggedIn: boolean = false;  // Estado de autenticación
  loading: boolean = true; // Variable para controlar el estado de carga

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
  }

  // Función para hacer logout
  logout() {
    this.authService.logout(); // Usamos el servicio de autenticación para hacer logout
    this.router.navigate(['/login']);
  }
}
