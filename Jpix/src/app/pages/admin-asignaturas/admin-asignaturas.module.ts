import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // <-- 1. IMPORTA AQUÍ

import { IonicModule } from '@ionic/angular';

import { AdminAsignaturasPageRoutingModule } from './admin-asignaturas-routing.module';

import { AdminAsignaturasPage } from './admin-asignaturas.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminAsignaturasPageRoutingModule,
    ReactiveFormsModule // <-- 2. AÑÁDELO AQUÍ
  ],
  declarations: [AdminAsignaturasPage]
})
export class AdminAsignaturasPageModule {}