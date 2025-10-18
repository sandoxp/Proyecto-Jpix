import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';

export interface ApiResponse<T> { data: T; }

export interface Bloque {
  dia: 'LUN'|'MAR'|'MIE'|'JUE'|'VIE'|'SAB';
  clave_ini?: number; clave_fin?: number;
  hora_inicio?: string; hora_fin?: string;
  sede?: string; sala?: string; actividad?: 'CAT'|'TAL'|'AY';
}
export interface Seccion {
  id: number; seccion: string; docente?: string; bloques?: Bloque[];
}
export interface Asignatura {
  sigla: string; nombre: string; creditos?: number;
  tipo?: 'obligatoria'|'fofu'|'ingles'|'optativa';
  semestralidad?: 'ANUAL'|'SEMESTRAL';
  tasa_aprobacion?: number | null;
  tasa_aprobacion_pct?: string | null;
  secciones?: Seccion[];
}

@Injectable({ providedIn: 'root' })
export class AsignaturasService {
  private base = `${environment.API_URL}/asignaturas`;
  constructor(private http: HttpClient) {}
  list(): Observable<Asignatura[]> {
    return this.http.get<ApiResponse<Asignatura[]>>(this.base).pipe(map(r => r.data));
  }
  get(sigla: string): Observable<Asignatura> {
    return this.http.get<ApiResponse<Asignatura>>(`${this.base}/${sigla}`).pipe(map(r => r.data));
  }
}
