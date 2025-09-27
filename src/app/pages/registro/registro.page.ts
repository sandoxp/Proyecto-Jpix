import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: false,
})
export class RegistroPage {
  email: string = '';
  username: string = '';
  documentType: string = 'rut'; // 'rut' o 'pasaporte'
  rut: string = '';
  passport: string = '';
  country: string = '';
  comuna: string = '';
  phone: string = '';
  password: string = '';
  confirmPassword: string = '';
  termsAccepted: boolean = false;

  constructor(private router: Router) {}

  register() {
    if (this.password !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (!this.termsAccepted) {
      alert('Debes aceptar los términos y condiciones');
      return;
    }

    // Verificamos que los campos requeridos no estén vacíos
    if (!this.email || !this.username || !this.rut || !this.password || !this.phone) {
      alert('Por favor, completa todos los campos requeridos');
      return;
    }

    // Aquí puedes implementar la lógica de registro con la API o almacenarlo localmente.
    // Si es exitoso, redirigimos al login o home.
    alert('Registro exitoso');
    this.router.navigate(['/login']); // O la página que corresponda
  }
}
