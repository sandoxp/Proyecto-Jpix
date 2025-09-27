import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth';  // Importamos el servicio de autenticación

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email: string = '';
  password: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  login() {
    // Aquí agregamos una validación simple para el correo y la contraseña
    if (this.email && this.password) {
      // Simulación de autenticación (en la práctica, harías una llamada a la API)
      this.authService.login(); // Usamos el servicio para registrar el login
      this.router.navigate(['/home']); // Redirigimos a la página de home después de login
    } else {
      alert('Por favor ingresa un correo y una contraseña válidos');
    }
  }
}
