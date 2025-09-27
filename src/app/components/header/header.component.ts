import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth'; // ajusta la ruta si tu servicio está en otra carpeta

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent implements OnInit {
  // Texto central
  @Input() title: string = 'JPIX';

  // Texto del chip (derecha)
  @Input() roleLabel: string = 'Estudiante'; // o 'Administrador' según tu lógica

  // Avatar junto a JPIX
  @Input() avatarSrc: string = 'assets/images/assistant-logo.png';

  // Estado del popover
  roleMenuOpen = false;
  roleMenuEvent: any = null;

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {}

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
    this.auth.logout();          // emite el cambio y borra localStorage
    this.router.navigate(['/login']);
  }

  // (Opcionales) Métodos de navegación que ya tenías
  goToHome()     { this.router.navigate(['/home']); }
  goToCatalogo() { this.router.navigate(['/catalogo']); }
  goToHorario()  { this.router.navigate(['/horario']); }
  goToPerfil()   { this.router.navigate(['/perfil']); }
}
