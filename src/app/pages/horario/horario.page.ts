import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-horario',
  templateUrl: './horario.page.html',
  styleUrls: ['./horario.page.scss'],
  standalone: false,
})
export class HorarioPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {

    // Verificar si el usuario está logueado
    const user = localStorage.getItem('user');  // Verifica si 'user' está en localStorage

    if (!user) {
      // Si no está logueado, redirigir al login
      this.router.navigate(['/login']);
    }
  }

}
