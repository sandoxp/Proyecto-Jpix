import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

type LoginPayload = { email?: string; rut?: string; password: string; role?: string };
type Pair = { data: { token: string; refreshToken: string; user?: any } };

export interface UserData {
  id: number;
  nombre: string;
  email: string;
  rut: string;
  rol: 'admin' | 'estudiante';
  carrera: string;
  periodo_malla: number;
  ira: 'bajo' | 'medio' | 'alto';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(!!localStorage.getItem('token'));
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // --- CORRECCIÓN 1: El rol por defecto debe ser 'null' (nadie) ---
  private roleSubject = new BehaviorSubject<string | null>(localStorage.getItem('role') || null);
  role$ = this.roleSubject.asObservable();

  private base = environment.API_URL;

  constructor(private http: HttpClient) {}

  register(body: { 
    rut: string; 
    nombre: string; 
    email: string; 
    password: string; 
    rol?: 'admin'|'estudiante';
    carrera?: string;
    periodo_malla?: number | null;
    ira?: string;
  }): Observable<Pair> {
    return this.http.post<Pair>(`${this.base}/auth/register`, body);
  }

  // --- CORRECCIÓN 2: Lógica de Login arreglada ---
  loginWithCredentials(payload: LoginPayload): Observable<Pair> {
    return this.http.post<Pair>(`${this.base}/auth/login`, payload).pipe(
      tap(({ data }) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        let userRole: 'admin' | 'estudiante' = 'estudiante';
        
        if (data.user) {
          // Caso 1: Es Admin (o un Estudiante que devuelve datos)
          localStorage.setItem('user', JSON.stringify(data.user));
          userRole = data.user.rol || 'estudiante';
        } else {
          // Caso 2: Es Estudiante (y data.user es null)
          // ¡Debemos limpiar los datos del admin anterior!
          localStorage.removeItem('user'); 
          userRole = 'estudiante';
        }
        
        // Guardamos el rol y actualizamos el Subject
        localStorage.setItem('role', userRole); 
        this.roleSubject.next(userRole);
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

  updateSelf(body: { 
    nombre?: string; 
    email?: string; 
    carrera?: string;
    periodo_malla?: number;
    ira?: 'bajo' | 'medio' | 'alto';
  }): Observable<Pair> { 
    return this.http.put<Pair>(`${this.base}/usuarios/me`, body).pipe(
      tap(({ data }) => {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          const role = data.user.rol || 'estudiante';
          localStorage.setItem('role', role);
          this.roleSubject.next(role);
        }
      })
    );
  }

  public getUser(): UserData | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
      return null;
    }
  }

  // --- CORRECCIÓN 3: Logout arreglado ---
  logout() {
    const refreshToken = localStorage.getItem('refreshToken') || '';
    this.http.post(`${this.base}/auth/logout`, { refreshToken }).subscribe({ next: () => {} });
    
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user'); // <-- Limpia el 'user'
    localStorage.removeItem('role'); // <-- Limpia el 'role'
    
    this.isAuthenticatedSubject.next(false);
    this.roleSubject.next(null); // <-- Resetea el Subject a 'null'
  }
}