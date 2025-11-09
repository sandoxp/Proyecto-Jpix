import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: false,
})
export class ChatPage implements OnInit, AfterViewChecked {
  userMessage: string = '';
  assistantMessages: string[] = [];
  isChatOpen: boolean = true;
  loading: boolean = false;

  // 🔧 AÑADIDO: Para auto-scroll
  @ViewChild('messagesEnd') private messagesEnd: ElementRef | undefined;
  private shouldScroll = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private chatService: ChatService
  ) {}

  // 🔧 AÑADIDO: Auto-scroll después de cada actualización
  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  // 🔧 MÉTODO PARA AUTO-SCROLL
  private scrollToBottom(): void {
    try {
      if (this.messagesEnd?.nativeElement) {
        this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error en scroll:', err);
    }
  }

  async ngOnInit() {
    const navigationState = this.router.getCurrentNavigation()?.extras.state;

    if (navigationState && navigationState['startFlow']) {
      this.chatService.resetConversation();
      this.loading = true;
      this.assistantMessages.push('Jpix: ...escribiendo');
      this.shouldScroll = true; // 🔧 AÑADIDO

      const flow = navigationState['startFlow'] as 'organizar' | 'ubicacion' | 'agregar';
      const opening = await this.chatService.startFlow(flow);

      this.assistantMessages[this.assistantMessages.length - 1] = `Jpix: ${opening}`;
      this.loading = false;
      this.shouldScroll = true; // 🔧 AÑADIDO

      const preset = navigationState['userQuery'];
      if (preset) {
        this.assistantMessages.push(`Tú: ${preset}`);
        this.loading = true;
        this.assistantMessages.push('Jpix: ...escribiendo');
        this.shouldScroll = true; // 🔧 AÑADIDO

        const response = await this.chatService.getResponse(preset);

        this.assistantMessages[this.assistantMessages.length - 1] = `Jpix: ${response}`;
        this.loading = false;
        this.shouldScroll = true; // 🔧 AÑADIDO
      }

      this.userMessage = '';
      return;
    }

    if (navigationState && navigationState['userQuery']) {
      this.chatService.resetConversation();
      this.userMessage = navigationState['userQuery'];
      this.assistantMessages.push(`Tú: ${this.userMessage}`);
      this.loading = true;
      this.assistantMessages.push('Jpix: ...escribiendo');
      this.shouldScroll = true; // 🔧 AÑADIDO

      const response = await this.chatService.getResponse(this.userMessage);

      this.assistantMessages[this.assistantMessages.length - 1] = `Jpix: ${response}`;
      this.loading = false;
      this.shouldScroll = true; // 🔧 AÑADIDO
      this.userMessage = '';
    }
  }

  async onSendMessage() {
    if (this.loading || !this.userMessage) {
      return;
    }

    const message = this.userMessage;
    this.assistantMessages.push(`Tú: ${message}`);
    this.userMessage = '';
    this.loading = true;
    this.shouldScroll = true; // 🔧 AÑADIDO

    this.assistantMessages.push('Jpix: ...escribiendo');
    const loadingIndex = this.assistantMessages.length - 1;

    try {
      const response = await this.chatService.getResponse(message);
      this.assistantMessages[loadingIndex] = `Jpix: ${response}`;
    } catch (error) {
      console.error('Error en getResponse', error);
      this.assistantMessages[loadingIndex] = 'Jpix: Lo siento, ocurrió un error al procesar tu solicitud.';
    } finally {
      this.loading = false;
      this.shouldScroll = true; // 🔧 AÑADIDO
    }
  }
}