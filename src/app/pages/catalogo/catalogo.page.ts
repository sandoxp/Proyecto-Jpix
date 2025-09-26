import { Component } from '@angular/core';
import { ToastController } from '@ionic/angular';

type CourseType = 'Obligatorio' | 'FoFu' | 'Electivo' | string;

interface Course {
  code: string;
  name: string;
  type: CourseType;
  credits: number;
  professor: string;
  schedule: string[];
  campus: string;
  approval: number;
}

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  standalone: false,
})
export class CatalogoPage {
  courses: Course[] = [
    {
      code: 'INF3541-1',
      name: 'Taller Base de datos',
      type: 'Obligatorio',
      credits: 3,
      professor: 'Ivan Mercado',
      schedule: ['Lunes 3-4', 'Miércoles 3-4'],
      campus: 'IBC',
      approval: 85
    },
    {
      code: 'INF3541-2',
      name: 'Taller Base de datos',
      type: 'Obligatorio',
      credits: 3,
      professor: 'Ivan Mercado',
      schedule: ['Martes 3-4', 'Jueves 3-4'],
      campus: 'IBC',
      approval: 85
    },
    {
      code: 'EPE073-1',
      name: 'Cultura y Ciudadanía Digital',
      type: 'FoFu',
      credits: 2,
      professor: 'Rafael Escobar',
      schedule: ['No tiene'],
      campus: 'B-learning',
      approval: 97
    }
  ];

  constructor(private toastCtrl: ToastController) {}

  trackByCode(_: number, c: Course) { return c.code; }

  async addCourse(c: Course) {
    const toast = await this.toastCtrl.create({
      message: `${c.code} agregado al borrador de horario`,
      duration: 1500,
      position: 'bottom'
    });
    await toast.present();
  }
}
