import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  standalone: false,
})
export class TabsComponent  implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {}

  goToHome(){
    this.router.navigate(['/home']);
  }

  goToCatalogo(){
    this.router.navigate(['/catalogo']);
  }

  goToHorario(){
    this.router.navigate(['/horario']);
  }

  goToPerfil(){
    this.router.navigate(['/perfil']);
  }

}
