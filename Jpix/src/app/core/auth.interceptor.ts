import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  private refreshing = false;

  constructor(private router: Router, private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const t = localStorage.getItem('token');
    const authReq = t ? req.clone({ setHeaders: { Authorization: `Bearer ${t}` } }) : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status !== 401) return throwError(() => err);
        if (this.refreshing) return throwError(() => err); // evita bucles

        this.refreshing = true;
        return this.auth.refresh().pipe(
          switchMap(({ data }) => {
            this.refreshing = false;
            const newReq = req.clone({ setHeaders: { Authorization: `Bearer ${data.token}` } });
            return next.handle(newReq);
          }),
          catchError((e) => {
            this.refreshing = false;
            this.auth.logout();
            this.router.navigate(['/login']);
            return throwError(() => e);
          })
        );
      })
    );
  }
}
