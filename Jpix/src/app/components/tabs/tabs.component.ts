import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
// --- 1. IMPORTAR AUTHSERVICE Y OBSERVABLE ---
import { AuthService } from 'src/app/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  standalone: false,
})
export class TabsComponent implements OnInit {

  // --- 2. AÑADIR OBSERVABLES DE ROL ---
  public isEstudiante$: Observable<boolean>;
  public isAdmin$: Observable<boolean>;

  // --- 3. INYECTAR AuthService ---
  constructor(
    private router: Router,
    private auth: AuthService
  ) {
    // --- 4. DEFINIR LOS OBSERVABLES ---
    this.isEstudiante$ = this.auth.role$.pipe(
      map(role => role === 'estudiante')
    );
    this.isAdmin$ = this.auth.role$.pipe(
      map(role => role === 'admin')
    );
  }

  ngOnInit() {}

  // --- (Funciones de Estudiante existentes) ---
  goToHome(){
    this.router.navigate(['/home']);
  }
  goToCatalogo(){
    this.router.navigate(['/catalogo']);
  }
  goToHorario(){
    this.router.navigate(['/horario']);
  }
  goToPerfil(){
    this.router.navigate(['/perfil']);
  }
  goToProgreso() {
    this.router.navigate(['/progreso']);
  }

  // --- 5. AÑADIR FUNCIONES DE ADMIN ---
  // (Copiadas de tu header.component.ts)
  goToAdminUsuarios() {
    this.router.navigate(['/admin/usuarios']);
  }
  goToAdminAsignaturas() {
    this.router.navigate(['/admin/asignaturas']); 
  }
}