import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminSeccionesModalPage } from './admin-secciones-modal.page';

const routes: Routes = [
  {
    path: '',
    component: AdminSeccionesModalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminSeccionesModalPageRoutingModule {}
