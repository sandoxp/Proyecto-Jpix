import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  canActivate(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return of(false);
    }
    return this.auth.me().pipe(
      map(() => true),
      catchError(() => {
        this.auth.logout();
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
