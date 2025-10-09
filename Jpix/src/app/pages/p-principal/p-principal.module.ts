import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PPrincipalPageRoutingModule } from './p-principal-routing.module';

import { PPrincipalPage } from './p-principal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PPrincipalPageRoutingModule
  ],
  declarations: [PPrincipalPage]
})
export class PPrincipalPageModule {}
