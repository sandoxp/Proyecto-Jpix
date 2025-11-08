import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse, Seccion } from './asignaturas.service'; // Reutilizamos la interfaz

// --- 👇 AQUÍ ESTÁ LA CORRECCIÓN 1 👇 ---
export interface SeccionPayload {
  id?: number;
  asignatura_id: number;
  seccion: string;
  docente?: string;
  bloques: {
    dia: string;
    hora_inicio: string;
    hora_fin: string;
    sede: string;
    sala: string;
    clave_ini?: number | null; // <-- AÑADIDO
    clave_fin?: number | null; // <-- AÑADIDO
  }[];
}
// --- 👆 FIN DE LA CORRECCIÓN 1 👆 ---

@Injectable({ providedIn: 'root' })
export class SeccionesService {
  private base = `${environment.API_URL}/secciones`;
  constructor(private http: HttpClient) { }

  /**
   * Lista todas las secciones, opcionalmente filtradas por asignatura
   */
  list(asignaturaId?: number): Observable<ApiResponse<Seccion[]>> {
    let params = new HttpParams();
    if (asignaturaId) {
      params = params.set('asignatura_id', asignaturaId.toString());
    }
    return this.http.get<ApiResponse<Seccion[]>>(this.base, { params });
  }
  
  /**
   * Obtiene una sección por ID
   */
  getOne(id: number): Observable<ApiResponse<Seccion>> {
    return this.http.get<ApiResponse<Seccion>>(`${this.base}/${id}`);
  }

  /**
   * Crea una nueva sección (incluye bloques)
   */
  create(data: SeccionPayload): Observable<ApiResponse<Seccion>> {
    return this.http.post<ApiResponse<Seccion>>(this.base, data);
  }

  /**
   * Actualiza una sección (incluye bloques)
   */
  update(id: number, data: Partial<SeccionPayload>): Observable<ApiResponse<Seccion>> {
    return this.http.put<ApiResponse<Seccion>>(`${this.base}/${id}`, data);
  }

  /**
   * Elimina una sección (y sus bloques)
   */
  remove(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.base}/${id}`);
  }
}