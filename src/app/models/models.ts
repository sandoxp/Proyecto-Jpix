// models.ts
export interface Course {
  code: string;
  name: string;
  credits: number;
  professor: string;
}

export interface Schedule {
  day: string;
  time: string;
  course: Course;
}

export interface Student {
  id: string;
  name: string;
  semester: string;
  courses: Course[];
  schedule: Schedule[];
}
