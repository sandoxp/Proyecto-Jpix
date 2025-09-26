import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone:false,
})
export class HomePage implements OnInit {
  consulta = '';
  constructor() { }

  ngOnInit() {
  

  }
  onBuscar(){
    console.log('Buscando:', this.consulta);
  }
}
