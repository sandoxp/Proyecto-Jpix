import { Injectable } from '@angular/core';
import { Student, Schedule, Course } from "../models/models"; // Asegúrate de importar los modelos correctamente

@Injectable({
  providedIn: 'root',
})
export class AssistantService {
  private student: Student = {
    id: '1',
    name: 'Juan Pérez',
    semester: '2025',
    courses: [
      { code: 'MATH101', name: 'Matemáticas', credits: 5, professor: 'Dr. Gómez' },
      { code: 'PROG102', name: 'Programación', credits: 4, professor: 'Dr. Ruiz' },
    ],
    schedule: [
      { day: 'Lunes', time: '08:00 - 10:00', course: { code: 'MATH101', name: 'Matemáticas', credits: 5, professor: 'Dr. Gómez' } },
      { day: 'Martes', time: '10:00 - 12:00', course: { code: 'PROG102', name: 'Programación', credits: 4, professor: 'Dr. Ruiz' } },
    ],
  };

  constructor() {}

  // Método para obtener los datos del estudiante
  getStudentData(): Student {
    return this.student;
  }

  // Método para organizar el horario (simulado)
  organizeSchedule(): string {
    // Lógica para reorganizar el horario (en el futuro será una llamada API)
    return `El horario de ${this.student.name} ha sido reorganizado para el semestre ${this.student.semester}.`;
  }
}
