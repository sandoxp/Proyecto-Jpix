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
  const navigationState = this.router.getCurrentNavigation()?.extras.state;

  // Si viene desde Home con flujo explícito
  if (navigationState && navigationState['startFlow']) {
    this.chatService.resetConversation();

    const flow = navigationState['startFlow'] as 'organizar' | 'ubicacion' | 'agregar';
    const opening = this.chatService.startFlow(flow); // << muestra saludo/inicio del flujo
    this.assistantMessages.push(`Jpix: ${opening}`);

    // Si quieres, también pinta el texto del botón como mensaje del usuario (opcional):
    const preset = navigationState['userQuery'];
    if (preset) {
      this.assistantMessages.push(`Tú: ${preset}`);
      const response = this.chatService.getResponse(preset);
      this.assistantMessages.push(`Jpix: ${response}`);
    }

    this.userMessage = '';
    return;
  }

  // Caso anterior: si solo viene userQuery sin startFlow
  if (navigationState && navigationState['userQuery']) {
    this.chatService.resetConversation();
    this.userMessage = navigationState['userQuery'];
    this.assistantMessages.push(`Tú: ${this.userMessage}`);
    const response = this.chatService.getResponse(this.userMessage);
    this.assistantMessages.push(`Jpix: ${response}`);
    this.userMessage = '';
  }
}


  onSendMessage() {
    if (this.userMessage) {
      this.assistantMessages.push(`Tú: ${this.userMessage}`);
      const response = this.chatService.getResponse(this.userMessage);
      this.assistantMessages.push(`Jpix: ${response}`);
      this.userMessage = '';
    }
  }
}
