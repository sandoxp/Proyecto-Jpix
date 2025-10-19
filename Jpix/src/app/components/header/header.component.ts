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
  title: string = 'JPIX';
  avatarSrc: string = 'assets/images/assistant-logo.png';
  roleLabel: string = 'Estudiante';
  roleMenuOpen = false;
  roleMenuEvent: any = null;

  // 👇 NUEVO: flag para mostrar botón admin
  isAdmin = false;

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    // fallback: al refrescar la app
    const r0 = localStorage.getItem('role') || 'estudiante';
    this.isAdmin = (r0 === 'admin');
    this.roleLabel = r0 ? r0.charAt(0).toUpperCase() + r0.slice(1) : 'Estudiante';

    // reactivo: si cambia el rol
    this.auth.role$.subscribe(role => {
      const r = role || 'estudiante';
      this.roleLabel = r.charAt(0).toUpperCase() + r.slice(1);
      this.isAdmin = (r === 'admin');
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
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  goToHome() { this.router.navigate(['/home']); }
  goToCatalogo() { this.router.navigate(['/catalogo']); }
  goToHorario() { this.router.navigate(['/horario']); }
  goToPerfil() { this.router.navigate(['/perfil']); }

  // 👇 NUEVO: navegar a la vista admin
  goToAdminUsuarios() { this.router.navigate(['/admin/usuarios']); }
}
