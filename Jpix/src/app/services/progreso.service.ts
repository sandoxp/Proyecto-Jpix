import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse, Asignatura } from './asignaturas.service'; // Reutilizamos las interfaces

// Definimos el tipo de estado para claridad
export type ProgresoEstado = 'pendiente' | 'aprobada' | 'reprobada' | 'cursando';

// Esta es la interfaz que esperamos del backend para 'getProgreso'
// Es una Asignatura con el estado (obligatorio) ya añadido
export type AsignaturaConProgreso = Asignatura & {
  estado: ProgresoEstado;
};

// Esta es la respuesta del 'updateProgreso'
export interface UpdateProgresoResponse {
  registro: {
    id: number;
    usuario_id: number;
    asignatura_sigla: string;
    estado: ProgresoEstado;
    createdAt: string;
    updatedAt: string;
  };
  isCreated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProgresoService {
  // Apunta a la nueva ruta de la API
  private base = `${environment.API_URL}/progreso`;

  constructor(private http: HttpClient) { }

  /**
   * GET /progreso
   * Obtiene la malla completa con el estado de progreso del usuario.
   */
  getProgreso(): Observable<ApiResponse<AsignaturaConProgreso[]>> {
    // El AuthInterceptor se encarga de añadir el token
    return this.http.get<ApiResponse<AsignaturaConProgreso[]>>(this.base);
  }

  /**
   * PUT /progreso
   * Actualiza el estado de una asignatura para el usuario.
   */
  updateProgreso(sigla: string, estado: ProgresoEstado): Observable<ApiResponse<UpdateProgresoResponse>> {
    const body = {
      asignatura_sigla: sigla,
      estado: estado
    };
    // El AuthInterceptor se encarga de añadir el token
    return this.http.put<ApiResponse<UpdateProgresoResponse>>(this.base, body);
  }
}