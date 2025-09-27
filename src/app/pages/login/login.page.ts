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
  role: string = '';  // El valor predeterminado es vacío hasta que se seleccione el rol
  rut: string = '';
  usuario: string = '';   // Solo se usará si el rol es 'administrador'
  password: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  login() {
    // Validación de campos según el rol seleccionado
    if (this.role === 'estudiante') {
      if (this.rut && this.password) {
        this.authService.login(); // Usamos el servicio para registrar el login
        this.router.navigate(['/home']); // Redirigimos a la página de home después de login
      } else {
        alert('Por favor ingresa un rut y una contraseña válidos');
      }
    } else if (this.role === 'administrador') {
      if (this.usuario && this.rut && this.password) {
        this.authService.login(); // Usamos el servicio para registrar el login
        this.router.navigate(['/home']); // Redirigimos a la página de home después de login
      } else {
        alert('Por favor ingresa un usuario, rut y una contraseña válidos');
      }
    }
  }
}
