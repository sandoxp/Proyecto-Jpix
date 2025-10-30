import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

type LoginPayload = { email?: string; rut?: string; password: string; role?: string };
type Pair = { data: { token: string; refreshToken: string; user?: any } };

// --- INTERFAZ AÑADIDA PARA EL OBJETO USER ---
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
// ------------------------------------------

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(!!localStorage.getItem('token'));
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private roleSubject = new BehaviorSubject<string>(localStorage.getItem('role') || 'estudiante');
  role$ = this.roleSubject.asObservable();

  private base = environment.API_URL;

  constructor(private http: HttpClient) {}

  // REGISTRO: (Modificado para incluir IRA)
  register(body: { 
    rut: string; 
    nombre: string; 
    email: string; 
    password: string; 
    rol?: 'admin'|'estudiante';
    carrera?: string;
    periodo_malla?: number | null;
    ira?: string; // <-- AÑADIDO
  }): Observable<Pair> {
    return this.http.post<Pair>(`${this.base}/auth/register`, body);
  }

  loginWithCredentials(payload: LoginPayload): Observable<Pair> {
    return this.http.post<Pair>(`${this.base}/auth/login`, payload).pipe(
      tap(({ data }) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user)); // <-- Esto ya guarda el 'ira'
          const role = data.user.rol || 'estudiante';
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

  // ==================================================================
  // ================== 👇 FUNCIÓN MODIFICADA 👇 ======================
  // ==================================================================
  /**
   * Actualiza el perfil del propio usuario logueado
   * Llama al endpoint: PUT /api/v1/usuarios/me
   */
  updateSelf(body: { 
    nombre?: string; 
    email?: string; 
    carrera?: string;
    periodo_malla?: number;
    ira?: 'bajo' | 'medio' | 'alto'; // <-- AÑADIDO
  }): Observable<Pair> { 
    return this.http.put<Pair>(`${this.base}/usuarios/me`, body).pipe(
      tap(({ data }) => {
        // Actualiza el 'user' en localStorage con la respuesta
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user)); // <-- Esto actualiza el 'ira' en localStorage
          const role = data.user.rol || 'estudiante';
          localStorage.setItem('role', role);
          this.roleSubject.next(role);
        }
      })
    );
  }
  // ==================================================================
  // ================== 👆 FIN DE FUNCIÓN MODIFICADA 👆 ================
  // ==================================================================

  // ==================================================================
  // ================== 👇 FUNCIÓN AÑADIDA 👇 =======================
  // ==================================================================
  /**
   * Obtiene el objeto del usuario parseado desde localStorage
   */
  public getUser(): UserData | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
      return null;
    }
  }
  // ==================================================================
  // ================== 👆 FIN DE FUNCIÓN AÑADIDA 👆 ==================
  // ==================================================================

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