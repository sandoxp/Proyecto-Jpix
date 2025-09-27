import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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
  @Input() roleLabel: string = 'Estudiante';

  // Avatar junto a JPIX (misma imagen que usas en Home)
  @Input() avatarSrc: string = 'assets/images/assistant-logo.png';

  constructor(private router: Router) {}

  ngOnInit() {}

  // Chip clickeable (por ahora sin acción; queda listo para futura lógica)
  onRoleClick(): void {
    // no-op intencional (puedes abrir un popover/cambiar rol aquí más adelante)
  }

  // Métodos de navegación (conservados)
  goToHome()     { this.router.navigate(['/home']); }
  goToCatalogo() { this.router.navigate(['/catalogo']); }
  goToHorario()  { this.router.navigate(['/horario']); }
  goToPerfil()   { this.router.navigate(['/perfil']); }
}
