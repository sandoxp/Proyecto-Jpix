import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminRequisitosModalPage } from './admin-requisitos-modal.page';

const routes: Routes = [
  {
    path: '',
    component: AdminRequisitosModalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRequisitosModalPageRoutingModule {}
