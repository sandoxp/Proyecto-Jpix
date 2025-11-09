import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';

export interface ApiResponse<T> { data: T; }

export interface Bloque {
  dia: 'LUN' | 'MAR' | 'MIE' | 'JUE' | 'VIE' | 'SAB';
  clave_ini?: number; clave_fin?: number;
  hora_inicio?: string; hora_fin?: string;
  sede?: string; sala?: string; actividad?: 'CAT' | 'TAL' | 'AY';
}
export interface Seccion {
  id: number; 
  seccion: string; 
  docente?: string; 
  bloques?: Bloque[]; // Esta interfaz ya la teníamos
  
  // --- AÑADIDO: Campos del modelo seccion.js ---
  asignatura_id: number; 
  nombre?: string;
  codigo_completo?: string;
}

// ===============================================
// --- 👇 AQUÍ ESTÁ LA CORRECCIÓN 👇 ---
// ===============================================
export interface Asignatura {
  id: number; // <-- LA PROPIEDAD QUE FALTABA
  sigla: string; 
  nombre: string; 
  creditos?: number;
  tipo?: 'obligatoria' | 'fofu' | 'ingles' | 'optativa';
  semestralidad?: 'ANUAL' | 'SEMESTRAL';
  tasa_aprobacion?: number | null;
  tasa_aprobacion_pct?: string | null;
  secciones?: Seccion[];
  periodo_malla?: number | null;
  estado?: 'pendiente' | 'aprobada' | 'reprobada' | 'cursando';
}

export type AsignaturaPayload = Omit<Asignatura, 'id' | 'secciones' | 'estado' | 'tasa_aprobacion_pct'>;


@Injectable({ providedIn: 'root' })
export class AsignaturasService {
  private base = `${environment.API_URL}/asignaturas`;
  constructor(private http: HttpClient) { }

  // --- Métodos GET existentes ---
  list(): Observable<ApiResponse<Asignatura[]>> {
    return this.http.get<ApiResponse<Asignatura[]>>(this.base);
  }

  getBySigla(sigla: string): Observable<ApiResponse<Asignatura>> {
    return this.http.get<ApiResponse<Asignatura>>(`${this.base}/${sigla}`);
  }

  getMiCatalogo(): Observable<ApiResponse<Asignatura[]>> {
    return this.http.get<ApiResponse<Asignatura[]>>(`${this.base}/mi-catalogo`);
  }

  // ==============================================================
  // --- INICIO: NUEVA FUNCIÓN PARA EL CHAT (PASO 1) ---
  // ==============================================================
  /**
   * Llama al endpoint de búsqueda del backend.
   * @param query Término de búsqueda (ej. "calculo" o "INF-100")
   */
  buscar(query: string): Observable<ApiResponse<Asignatura[]>> {
    // Usamos encodeURIComponent para que el query sea seguro en una URL
    // (ej. "base de datos" se convierte en "base%20de%20datos")
    // El objeto 'params' se encargará de añadir ?q=... a la URL
    const params = { q: query };
    return this.http.get<ApiResponse<Asignatura[]>>(`${this.base}/buscar`, { params });
  }
  // ==============================================================
  // --- FIN DE LA NUEVA FUNCIÓN ---
  // ==============================================================

  // --- Métodos CRUD de Admin (Paso 1) ---
  create(data: AsignaturaPayload): Observable<ApiResponse<Asignatura>> {
    return this.http.post<ApiResponse<Asignatura>>(this.base, data);
  }

  update(sigla: string, data: Partial<AsignaturaPayload>): Observable<ApiResponse<Asignatura>> {
    return this.http.put<ApiResponse<Asignatura>>(`${this.base}/${sigla}`, data);
  }

  remove(sigla: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.base}/${sigla}`);
  }
}