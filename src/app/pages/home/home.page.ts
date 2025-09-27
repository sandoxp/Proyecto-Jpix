import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  consulta = '';

  constructor(private router: Router) {}

  ngOnInit() {
    // Verificar si el usuario está logueado
    const user = localStorage.getItem('user');  // Verifica si 'user' está en localStorage

    if (!user) {
      // Si no está logueado, redirigir al login
      this.router.navigate(['/login']);
    }
  }

  onBuscar() {
    console.log('Buscando:', this.consulta);
  }
}
