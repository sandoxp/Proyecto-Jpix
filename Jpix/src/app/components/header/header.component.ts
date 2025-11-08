import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth';
import { IonMenu } from '@ionic/angular'; 

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
  isAdmin = false;
  isEstudiante = true;
  isDarkMode = false;
  isColorblindMode = false;

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    const r0 = localStorage.getItem('role') || 'estudiante';
    this.isAdmin = (r0 === 'admin');
    this.isEstudiante = (r0 === 'estudiante');
    this.roleLabel = r0 ? r0.charAt(0).toUpperCase() + r0.slice(1) : 'Estudiante';

    this.auth.role$.subscribe(role => {
      const r = role || 'estudiante';
      this.roleLabel = r.charAt(0).toUpperCase() + r.slice(1);
      this.isAdmin = (r === 'admin');
      this.isEstudiante = (r === 'estudiante');
    });
    
    this.checkDarkMode();
    this.checkColorblindMode();
  }

  // --- (Funciones de Popover y Navegación de Menú) ---
  openRoleMenu(ev: Event) {
    this.roleMenuEvent = ev;
    this.roleMenuOpen = true;
  }
  viewProfile() {
    this.roleMenuOpen = false;
    this.router.navigate(['/perfil']);
  }
  logout() {
    this.roleMenuOpen = false;
    this.auth.logout();
    this.router.navigate(['/login']);
  }
  goToHome(menu?: IonMenu) {
    menu?.close(); 
    this.router.navigate(['/home']);
  }
  goToCatalogo(menu?: IonMenu) {
    menu?.close();
    this.router.navigate(['/catalogo']);
  }
  goToHorario(menu?: IonMenu) {
    menu?.close();
    this.router.navigate(['/horario']);
  }
  goToPerfil(menu?: IonMenu) {
    menu?.close();
    this.router.navigate(['/perfil']);
  }
  goToProgreso(menu?: IonMenu) { 
    menu?.close();
    this.router.navigate(['/progreso']);
  }

  // ===============================================
  // --- 👇 FUNCIONES RESTAURADAS 👇 ---
  // ===============================================
  // (Estas funciones son necesarias para el menú lateral)
  goToAdminUsuarios(menu?: IonMenu) {
    menu?.close();
    this.router.navigate(['/admin/usuarios']);
  }
  goToAdminAsignaturas(menu?: IonMenu) {
    menu?.close();
    this.router.navigate(['/admin/asignaturas']); 
  }
  // --- 👆 FIN DE FUNCIONES RESTAURADAS 👆 ---

  // --- (Funciones de Accesibilidad) ---
  checkDarkMode() {
    const storedValue = localStorage.getItem('darkMode');
    this.isDarkMode = storedValue === 'true';
    document.body.classList.toggle('dark', this.isDarkMode);
  }
  checkColorblindMode() {
    const storedValue = localStorage.getItem('colorblindMode');
    this.isColorblindMode = storedValue === 'true';
    document.body.classList.toggle('colorblind', this.isColorblindMode);
  }
  toggleDarkMode(){
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }
  toggleColorblindMode() {
    this.isColorblindMode = !this.isColorblindMode;
    document.body.classList.toggle('colorblind', this.isColorblindMode);
    localStorage.setItem('colorblindMode', this.isColorblindMode.toString());
  }
}