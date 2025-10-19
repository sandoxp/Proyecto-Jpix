import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const role = localStorage.getItem('role');
    if (role === 'admin') return true;
    // si no es admin, lo mandamos al home (o login)
    this.router.navigate(['/home']);
    return false;
  }
}
