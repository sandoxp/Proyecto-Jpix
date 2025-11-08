import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminAsignaturasPage } from './admin-asignaturas.page';

const routes: Routes = [
  {
    path: '',
    component: AdminAsignaturasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminAsignaturasPageRoutingModule {}
