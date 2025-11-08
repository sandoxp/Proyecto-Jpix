import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth-guard';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'catalogo',
    loadChildren: () => import('./pages/catalogo/catalogo.module').then( m => m.CatalogoPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'horario',
    loadChildren: () => import('./pages/horario/horario.module').then( m => m.HorarioPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'perfil',
    loadChildren: () => import('./pages/perfil/perfil.module').then( m => m.PerfilPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'progreso',
    loadChildren: () => import('./pages/progreso/progreso.module').then( m => m.ProgresoPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/usuarios',
    loadChildren: () => import('./pages/admin-usuarios/admin-usuarios.module').then( m => m.AdminUsuariosPageModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'admin/asignaturas', 
    loadChildren: () => import('./pages/admin-asignaturas/admin-asignaturas.module').then( m => m.AdminAsignaturasPageModule),
    canActivate: [AuthGuard, AdminGuard]
  },


  {
    path: 'admin-secciones-modal',
    loadChildren: () => import('./pages/admin-secciones-modal/admin-secciones-modal.module').then( m => m.AdminSeccionesModalPageModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  

  {
    path: 'admin-requisitos-modal',
    loadChildren: () => import('./pages/admin-requisitos-modal/admin-requisitos-modal.module').then( m => m.AdminRequisitosModalPageModule),
    canActivate: [AuthGuard, AdminGuard]
  },


  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'registro',
    loadChildren: () => import('./pages/registro/registro.module').then( m => m.RegistroPageModule)
  },
  {
    path: 'chat',
    loadChildren: () => import('./pages/chat/chat.module').then( m => m.ChatPageModule)
  }
  
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }