import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth';  // Asegúrate de importar correctamente el servicio

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent implements OnInit {
  title: string = 'JPIX';  // Definimos el título
  avatarSrc: string = 'assets/images/assistant-logo.png';  // Definimos la fuente del avatar
  roleLabel: string = 'Estudiante'; // Por defecto, es 'Estudiante'
  roleMenuOpen = false;
  roleMenuEvent: any = null;

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    // Nos suscribimos al Observable que contiene el rol
    this.auth.role$.subscribe(role => {
      this.roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Estudiante';
    });
  }

  // Abre el popover anclado al chip
  openRoleMenu(ev: Event) {
    this.roleMenuEvent = ev;
    this.roleMenuOpen = true;
  }

  // Acciones del popover
  viewProfile() {
    this.roleMenuOpen = false;
    this.router.navigate(['/perfil']);
  }

  logout() {
    this.roleMenuOpen = false;
    this.auth.logout(); // Realizamos el logout en el servicio
    this.router.navigate(['/login']); // Redirigimos al login
  }

  goToHome() { this.router.navigate(['/home']); }
  goToCatalogo() { this.router.navigate(['/catalogo']); }
  goToHorario() { this.router.navigate(['/horario']); }
  goToPerfil() { this.router.navigate(['/perfil']); }
}
