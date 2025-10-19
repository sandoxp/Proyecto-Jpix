import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminUsuariosPage } from './admin-usuarios.page';
import { AuthGuard } from 'src/app/auth-guard';
import { AdminGuard } from 'src/app/guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminUsuariosPage,
    canActivate: [AuthGuard, AdminGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminUsuariosPageRoutingModule {}
