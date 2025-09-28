// src/app/models.ts

// --- Curso ---
export interface Course {
  code: string;          // "ING-102"
  name: string;          // "Inglés II"
  credits: number;
  professor: string;
  type?: 'Obligatoria' | 'Optativa' | 'FOFU' | 'Inglés';
  prereq?: string[];
  sections?: Section[];
}

// --- Sección ---
export interface Section {
  id: string;            // "A", "1", etc.
  schedule: ScheduleSlot[];
}

// --- Slot de horario ---
export interface ScheduleSlot {
  day: string;           // "Lun", "Mar", ...
  block: string;         // "3-4"
  room: string;          // "CC-202"
  campus: string;        // "Casa Central"
}

// --- Estudiante ---
export interface Student {
  id: string;
  name: string;
  semester: number;
  approvedCourses: string[];
  enrolledCourses: string[];
  schedule: Schedule[];
}

// --- Item en el horario (instancia concreta) ---
export interface Schedule {
  day: string;
  block: string;
  course: Course;
  sectionId?: string;
  room?: string;
  campus?: string;
}

/* ===========================
   Mocks opcionales (demo)
   =========================== */
export const COURSES_MOCK: Course[] = [
  {
    code: 'ING-102',
    name: 'Inglés II',
    credits: 6,
    professor: 'P. Smith',
    type: 'Inglés',
    prereq: ['Inglés I'],
    sections: [
      {
        id: 'A',
        schedule: [
          { day: 'Lun', block: '3-4', room: 'CC-202', campus: 'Casa Central' },
          { day: 'Mie', block: '3-4', room: 'CC-202', campus: 'Casa Central' },
        ],
      },
    ],
  },
  {
    code: 'INF-210',
    name: 'Estructuras de Datos',
    credits: 8,
    professor: 'M. Torres',
    type: 'Obligatoria',
    prereq: ['Programación Avanzada'],
    sections: [
      {
        id: '1',
        schedule: [
          { day: 'Mar', block: '1-2', room: 'SAU-15', campus: 'Sausalito' },
          { day: 'Jue', block: '1-2', room: 'SAU-15', campus: 'Sausalito' },
        ],
      },
    ],
  },
];

export const STUDENT_MOCK: Student = {
  id: '12.345.678-9',
  name: 'Estudiante',
  semester: 3,
  approvedCourses: ['Inglés I', 'Cálculo I', 'Programación Avanzada'],
  enrolledCourses: [],
  schedule: [],
};

export const CAMPUSES_MOCK = ['Casa Central', 'Sausalito', 'CURAU', 'Quillota'] as const;

export const DISTANCES_KM_MOCK: Record<string, Record<string, number>> = {
  'Casa Central': { 'Sausalito': 3.8, 'CURAU': 6.5, 'Quillota': 40 },
  'Sausalito': { 'Casa Central': 3.8, 'CURAU': 4.2, 'Quillota': 38 },
  'CURAU': { 'Casa Central': 6.5, 'Sausalito': 4.2, 'Quillota': 35 },
  'Quillota': { 'Casa Central': 40, 'Sausalito': 38, 'CURAU': 35 },
};
