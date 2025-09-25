import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PPrincipalPage } from './p-principal.page';

const routes: Routes = [
  {
    path: '',
    component: PPrincipalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PPrincipalPageRoutingModule {}
