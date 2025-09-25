import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent  implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {}

  goToHome(){
    this.router.navigate(['/home']);
  }

  goToPPrincipal(){
    this.router.navigate(['/p-principal']);
  }

}
