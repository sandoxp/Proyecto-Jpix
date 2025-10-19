import { Injectable } from '@angular/core';
import { BehaviorSubject, tap, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

type LoginPayload = { email?: string; rut?: string; password: string; role?: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(!!localStorage.getItem('token'));
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private roleSubject = new BehaviorSubject<string>(localStorage.getItem('role') || 'estudiante');
  role$ = this.roleSubject.asObservable();

  private base = environment.API_URL;

  constructor(private http: HttpClient) {}

  // REGISTRO → /auth/register
  // src/app/auth.ts
  register(body: { rut: string; nombre: string; email: string; password: string; rol?: 'admin'|'estudiante' }) {
    // NO guarda token aquí; solo llama a la API y deja que RegistroPage redirija a /login
    return this.http.post<{ data: { token: string; user: any } }>(
      `${this.base}/auth/register`,
      body
    );
  }


  // LOGIN → /auth/login (acepta email o rut según tu backend)
  loginWithCredentials(payload: LoginPayload): Observable<{ data: { token: string; user: any } }> {
    return this.http.post<{ data: { token: string; user: any } }>(`${this.base}/auth/login`, payload).pipe(
      tap(({ data }) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        const role = payload.role || data.user.rol || 'estudiante';
        localStorage.setItem('role', role);
        this.isAuthenticatedSubject.next(true);
        this.roleSubject.next(role);
      })
    );
  }

  me() { return this.http.get<{ data: any }>(`${this.base}/auth/me`); }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    this.isAuthenticatedSubject.next(false);
    this.roleSubject.next('estudiante');
  }
}
