import { Component } from '@angular/core';

type CourseType = 'obligatorio' | 'optativo' | 'fofu' | 'ingles';

interface Course {
  code: string;
  title: string;
  kind: string;      // texto que se muestra (Obligatorio, FoFu, etc.)
  room: string;
  mode: string;      // Presencial, B-learning, etc.
  type: CourseType;  // para estilos
}

/**
 * Mapa: day -> block -> Course
 * days: Lunes..Viernes
 * blocks: '1'..'10' (bloques/periodos)
 */
type ScheduleMap = Record<string, Record<string, Course | null>>;

@Component({
  selector: 'app-horario',
  templateUrl: './horario.page.html',
  styleUrls: ['./horario.page.scss'],
  standalone: false,
})
export class HorarioPage {

  // Buscador (solo visual por ahora)
  query = '';

  // Días y bloques a renderizar
  days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  blocks = ['1','2','3','4','5','6','7','8','9','10'];

  // Ejemplo de horario (puedes editar libremente)
  schedule: ScheduleMap = {
    Lunes: {
      '1': {
        code: 'INF3245-1 Taller',
        title: 'Cátedra',
        kind: 'Obligatorio',
        room: 'FIN 3-3',
        mode: 'Presencial',
        type: 'obligatorio'
      },
      '2': {
        code: 'INF3245-1 Taller',
        title: 'Cátedra',
        kind: 'Obligatorio',
        room: 'FIN 3-3',
        mode: 'Presencial',
        type: 'obligatorio'
      },
      '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null, '10': null,
    },
    Martes: {
      '1': null,
      '2': {
        code: 'INF3246-1 Cátedra',
        title: '',
        kind: 'Obligatorio',
        room: 'IBC 2-1',
        mode: 'Presencial',
        type: 'obligatorio'
      },
      '3': {
        code: 'INF3246-1 Cátedra',
        title: '',
        kind: 'Obligatorio',
        room: 'IBC 2-1',
        mode: 'Presencial',
        type: 'obligatorio'
      },
      '4': null, '5': null, '6': null, '7': null, '8': null, '9': null, '10': null,
    },
    Miércoles: {
      '1': null, '2': null, '3': null, '4': null,
      '5': {
        code: 'OI415-1 Ayudantía',
        title: '',
        kind: 'Optativo',
        room: 'FIN 3-3',
        mode: 'Presencial',
        type: 'optativo'
      },
      '6': null, '7': null, '8': null, '9': null, '10': null,
    },
    Jueves: {
      '1': {
        code: 'INF3245-1 Cátedra',
        title: '',
        kind: 'Obligatorio',
        room: 'FIN 3-3',
        mode: 'Presencial',
        type: 'obligatorio'
      },
      '2': {
        code: 'INF3245-1 Cátedra',
        title: '',
        kind: 'Obligatorio',
        room: 'FIN 3-3',
        mode: 'Presencial',
        type: 'obligatorio'
      },
      '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null, '10': null,
    },
    Viernes: {
      '1': {
        code: 'HIS-231 Cátedra',
        title: '',
        kind: 'FOFUS',
        room: 'CC 3-3',
        mode: 'Presencial',
        type: 'fofu'
      },
      '2': {
        code: 'HIS-231 Cátedra',
        title: '',
        kind: 'FOFUS',
        room: 'CC 3-3',
        mode: 'Presencial',
        type: 'fofu'
      },
      '3': null,
      '4': {
        code: 'ING 1002 Taller',
        title: '',
        kind: 'Inglés',
        room: 'SAU 3-3',
        mode: 'Presencial',
        type: 'ingles'
      },
      '5': {
        code: 'ING 1002-1 Taller',
        title: '',
        kind: 'Inglés',
        room: 'SAU 3-3',
        mode: 'Presencial',
        type: 'ingles'
      },
      '6': null, '7': null, '8': null, '9': null, '10': null,
    }
  };

  /** Devuelve el curso en (día, bloque) o null */
  getCourse(day: string, block: string): Course | null {
    return this.schedule?.[day]?.[block] ?? null;
  }

  /** Clase CSS según el tipo de curso */
  getCourseClass(day: string, block: string): string {
    const c = this.getCourse(day, block);
    return c ? c.type : '';
  }

  // Handlers UI (demo)
  onSearch(): void {
    // Por ahora solo imprime el query; aquí podrás enganchar lógica real si luego quieres
    console.log('Buscar:', this.query);
  }

  onConsultarClaves(): void {
    console.log('Consultar claves');
  }

  toggleDaltonismo(): void {
    // Ejemplo simple de alternar una clase en el <body> para alto contraste
    document.body.classList.toggle('alto-contraste');
  }
}
