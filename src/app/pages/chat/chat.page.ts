import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ChatService } from 'src/app/services/chat.service';  // El servicio que gestiona las respuestas del chat

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: false,
})
export class ChatPage implements OnInit {
  userMessage: string = '';  // Aquí guardaremos el mensaje del usuario
  assistantMessages: string[] = [];
  isChatOpen: boolean = true;

  constructor(private router: Router, private route: ActivatedRoute, private chatService: ChatService) {}

  ngOnInit() {
    // Obtener el estado de la navegación (la consulta pasada desde home)
    const navigationState = this.router.getCurrentNavigation()?.extras.state;
    if (navigationState && navigationState['userQuery']) {
      // Si se pasa la consulta, la mostramos en el chat
      this.userMessage = navigationState['userQuery'];
      this.assistantMessages.push(`Tú: ${this.userMessage}`);
      const response = this.chatService.getResponse(this.userMessage);
      this.assistantMessages.push(`Jpix: ${response}`);
    }
  }

  onSendMessage() {
    if (this.userMessage) {
      this.assistantMessages.push(`Tú: ${this.userMessage}`);
      const response = this.chatService.getResponse(this.userMessage);
      this.assistantMessages.push(`Jpix: ${response}`);
      this.userMessage = '';  // Limpiar la entrada
    }
  }
}
