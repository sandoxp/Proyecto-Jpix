import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth';  // Asegúrate de importar el AuthService
import { ChatService } from 'src/app/services/chat.service'; // Importa el ChatService

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  isAdmin: boolean = false;
  consulta: string = '';  // Consulta que el usuario ingresa
  assistantMessages: string[] = [];  // Mensajes del asistente (incluye las respuestas predefinidas)
  isChatOpen: boolean = false;  // Controla si el chat está abierto o cerrado

  constructor(private router: Router, private authService: AuthService, private chatService: ChatService) {}

  ngOnInit() {
    // Verificar el rol del usuario
    this.authService.role$.subscribe(role => {
      this.isAdmin = role === 'administrador'; // Si el rol es Administrador, muestra contenido exclusivo
    });
  }

  // Método que se llama al hacer clic en "Buscar" o presionar Enter
  onBuscar() {
  if (this.consulta) {
    // Redirigir al chat pasando la consulta como estado
    this.router.navigate(['/chat'], {
      state: { userQuery: this.consulta }  // Pasamos la consulta como estado
      });
    }
  }

}
