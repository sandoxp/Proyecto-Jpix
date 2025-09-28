import { Injectable } from '@angular/core';
// OJO a la ruta: si tu models está en src/app/models.ts, el import correcto es '../models'
import { Student, Schedule, Course } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class AssistantService {
  // Student ajustado al modelo actual:
  private student: Student = {
    id: '1',
    name: 'Juan Pérez',
    // Tu models pide semester:number (semestre 1..12), no un año:
    semester: 3,
    // Estos dos son obligatorios según tu models:
    approvedCourses: ['MATH101'],   // ej: ramos aprobados
    enrolledCourses: [],            // ramos en borrador/inscritos

    // Horario con 'block' (tu models usa 'block', no 'time'):
    schedule: [
      {
        day: 'Lunes',
        block: '08:00 - 10:00',
        course: { code: 'MATH101', name: 'Matemáticas', credits: 5, professor: 'Dr. Gómez' }
      },
      {
        day: 'Martes',
        block: '10:00 - 12:00',
        course: { code: 'PROG102', name: 'Programación', credits: 4, professor: 'Dr. Ruiz' }
      },
    ],
  };

  constructor() {}

  // Si todavía quieres obtener un listado de cursos “del alumno”,
  // ahora lo puedes derivar del horario:
  getStudentCoursesFromSchedule(): Course[] {
    const map = new Map<string, Course>();
    for (const s of this.student.schedule) map.set(s.course.code, s.course);
    return [...map.values()];
  }

  // Getter original
  getStudentData(): Student {
    return this.student;
  }

  organizeSchedule(): string {
    return `El horario de ${this.student.name} ha sido reorganizado para el semestre ${this.student.semester}.`;
  }
}
