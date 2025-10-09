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
  role: string = 'estudiante';  // El valor predeterminado es 'estudiante'
  email: string = '';
  password: string = '';
  rut: string = '';  // Definimos la propiedad rut
  usuario: string = '';  // Definimos la propiedad usuario

  constructor(private router: Router, private authService: AuthService) {}

  login() {
    // Validación de campos según el rol seleccionado
    if (this.role === 'estudiante') {
      if (this.rut && this.password) {
        this.authService.login('estudiante');  // Usamos el servicio para registrar el login con el rol
        this.router.navigate(['/home']);
      } else {
        alert('Por favor ingresa un rut y una contraseña válidos');
      }
    } else if (this.role === 'administrador') {
      if (this.usuario && this.rut && this.password) {
        this.authService.login('administrador');  // Usamos el servicio para registrar el login con el rol
        this.router.navigate(['/home']);
      } else {
        alert('Por favor ingresa un usuario, rut y una contraseña válidos');
      }
    }
  }
}
