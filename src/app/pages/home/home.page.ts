import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth';  // Asegúrate de importar el AuthService

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  isAdmin: boolean = false;
  consulta: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    // Verificar el rol del usuario
    this.authService.role$.subscribe(role => {
      this.isAdmin = role === 'administrador'; // Si el rol es Administrador, muestra contenido exclusivo
    });
  }

  onBuscar() {
    console.log('Buscando:', this.consulta);
  }
}
