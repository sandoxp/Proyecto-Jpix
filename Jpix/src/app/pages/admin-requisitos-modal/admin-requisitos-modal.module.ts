import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // <-- 1. IMPORTADO
import { IonicModule } from '@ionic/angular'; // <-- 2. IMPORTADO
import { AdminRequisitosModalPageRoutingModule } from './admin-requisitos-modal-routing.module';
import { AdminRequisitosModalPage } from './admin-requisitos-modal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule, // <-- 3. AÑADIDO (arregla ion-header, ion-skeleton-text, etc.)
    AdminRequisitosModalPageRoutingModule,
    ReactiveFormsModule // <-- 4. AÑADIDO (arregla formGroup)
  ],
  declarations: [
    AdminRequisitosModalPage // <-- 5. Se queda en declarations
  ] 
})
export class AdminRequisitosModalPageModule {}