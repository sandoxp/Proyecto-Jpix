import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: false,
})
export class ChatPage implements OnInit {
  userMessage: string = '';
  assistantMessages: string[] = [];
  isChatOpen: boolean = true;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    // Toma la consulta enviada desde Home via navigation state
    const navigationState = this.router.getCurrentNavigation()?.extras.state;
    if (navigationState && navigationState['userQuery']) {
      this.userMessage = navigationState['userQuery'];

      // Mostrar mensaje del usuario + respuesta del asistente
      this.assistantMessages.push(`Tú: ${this.userMessage}`);
      const response = this.chatService.getResponse(this.userMessage);
      this.assistantMessages.push(`Jpix: ${response}`);

      // IMPORTANTE: limpiar el input para que no quede "duplicado" listo para reenviar
      this.userMessage = '';
    }
  }

  onSendMessage() {
    if (this.userMessage) {
      this.assistantMessages.push(`Tú: ${this.userMessage}`);
      const response = this.chatService.getResponse(this.userMessage);
      this.assistantMessages.push(`Jpix: ${response}`);
      this.userMessage = ''; // limpiar después de enviar
    }
  }
}
