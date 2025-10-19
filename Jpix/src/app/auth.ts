import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

type LoginPayload = { email?: string; rut?: string; password: string; role?: string };
type Pair = { data: { token: string; refreshToken: string; user?: any } };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(!!localStorage.getItem('token'));
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private roleSubject = new BehaviorSubject<string>(localStorage.getItem('role') || 'estudiante');
  role$ = this.roleSubject.asObservable();

  private base = environment.API_URL;

  constructor(private http: HttpClient) {}

  // REGISTRO: (elige si guardar token o redirigir a /login)
  register(body: { rut: string; nombre: string; email: string; password: string; rol?: 'admin'|'estudiante' }): Observable<Pair> {
    return this.http.post<Pair>(`${this.base}/auth/register`, body);
    // Si quisieras dejar logueado, añade .pipe(tap(...)) guardando token/refresh/user
  }

  loginWithCredentials(payload: LoginPayload): Observable<Pair> {
    return this.http.post<Pair>(`${this.base}/auth/login`, payload).pipe(
      // en AuthService.loginWithCredentials
      tap(({ data }) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          const role = data.user.rol || 'estudiante';   // <- usa SIEMPRE el rol del backend
          localStorage.setItem('role', role);
          this.roleSubject.next(role);
        }
        this.isAuthenticatedSubject.next(true);
      })

    );
  }

  refresh(): Observable<Pair> {
    const refreshToken = localStorage.getItem('refreshToken') || '';
    return this.http.post<Pair>(`${this.base}/auth/refresh`, { refreshToken }).pipe(
      tap(({ data }) => {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      })
    );
  }

  me() { return this.http.get<{ data: any }>(`${this.base}/auth/me`); }

  logout() {
    const refreshToken = localStorage.getItem('refreshToken') || '';
    this.http.post(`${this.base}/auth/logout`, { refreshToken }).subscribe({ next: () => {} });
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    this.isAuthenticatedSubject.next(false);
    this.roleSubject.next('estudiante');
  }
}
