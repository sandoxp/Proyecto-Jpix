import { Injectable } from '@angular/core';
import { AssistantService } from './assistant.service';  // Importa el AssistantService para obtener los datos

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(private assistantService: AssistantService) {}

  // Método para obtener la respuesta del asistente
  getResponse(userMessage: string): string {
    if (userMessage.includes('Jpix, quiero que organices mi horario para este semestre')) {
      const studentData = this.assistantService.getStudentData();
      return `Claro! ${studentData.name}, tu semestre actual es el ${studentData.semester}, y tus asignaturas son: ${studentData.courses.map(course => course.name).join(', ')}.`;
    }

    if (userMessage.includes('distancia')) {
      return 'La distancia entre Sausalito y Casa Central es de 10 km.';
    }

    return 'Lo siento, no entendí tu solicitud.';
  }
}
