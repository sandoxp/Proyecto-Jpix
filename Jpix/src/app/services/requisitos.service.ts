// Jpix/src/app/services/requisitos.service.ts
// (COMPLETO)

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse, Asignatura } from './asignaturas.service'; // Reutilizamos interfaces

// Definimos la interfaz para un 'Requisito'
// (El backend nos devuelve la asignatura 'requerida' incluida)
export interface Requisito {
  id: number; // El ID de la fila en la tabla 'requisitos'
  asignatura_id: number;
  requiere_id: number;
  requerida: Asignatura; // La asignatura que ES el requisito
}

// Interfaz para el payload de creación
export interface RequisitoPayload {
  asignatura_sigla: string;
  requiere_sigla: string;
}

@Injectable({ providedIn: 'root' })
export class RequisitosService {
  private base = `${environment.API_URL}/requisitos`;
  constructor(private http: HttpClient) { }

  /**
   * Lista requisitos, filtrados por la sigla de la asignatura "dueña"
   * Llama a: GET /api/v1/requisitos?asignatura_sigla=INF101
   */
  list(asignaturaSigla: string): Observable<ApiResponse<Requisito[]>> {
    const params = new HttpParams().set('asignatura_sigla', asignaturaSigla);
    return this.http.get<ApiResponse<Requisito[]>>(this.base, { params });
  }

  /**
   * Crea una nueva relación de requisito
   * Llama a: POST /api/v1/requisitos
   */
  create(data: RequisitoPayload): Observable<ApiResponse<Requisito>> {
    return this.http.post<ApiResponse<Requisito>>(this.base, data);
  }

  /**
   * Elimina una relación de requisito por su ID de fila
   * Llama a: DELETE /api/v1/requisitos/:id
   */
  remove(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.base}/${id}`);
  }
}