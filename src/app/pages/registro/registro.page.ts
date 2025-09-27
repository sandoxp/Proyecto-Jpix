import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: false,
})
export class RegistroPage {

  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(private router: Router) {}

  register() {
    // Validamos que las contraseñas coincidan
    if (this.password === this.confirmPassword) {
      if (this.email && this.password) {
        // Simulación de creación de cuenta (en un sistema real, harías una llamada a la API)
        alert('Cuenta creada con éxito');
        this.router.navigate(['/login']); // Redirigimos al login después de registrar
      } else {
        alert('Por favor ingresa un correo y una contraseña válidos');
      }
    } else {
      alert('Las contraseñas no coinciden');
    }
  }
}
