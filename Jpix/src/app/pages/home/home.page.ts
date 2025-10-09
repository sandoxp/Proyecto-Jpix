import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  isAdmin: boolean = false;
  consulta: string = '';
  assistantMessages: string[] = [];
  isChatOpen: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    // Verificar el rol del usuario
    this.authService.role$.subscribe(role => {
      this.isAdmin = role === 'administrador';
    });
  }
  // dentro de HomePage
  goToChatFlow(flow: 'organizar' | 'ubicacion' | 'agregar', prompt?: string) {
    this.router.navigate(['/chat'], {
      state: {
        startFlow: flow,
        userQuery: prompt ?? '' // opcional, por si quieres también mostrar el texto del botón como "Tú: ..."
    }
  });
  }

  // Abrir el chat con una consulta predefinida desde los botones
  goToChat(query: string) {
    this.router.navigate(['/chat'], {
      state: { userQuery: query }
    });
  }

  // Buscar desde el input de Home (mantengo tu comportamiento)
  onBuscar() {
    if (this.consulta) {
      this.router.navigate(['/chat'], {
        state: { userQuery: this.consulta }
      });
    }
  }
}
