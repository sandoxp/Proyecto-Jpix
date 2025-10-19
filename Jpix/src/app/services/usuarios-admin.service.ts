import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export type Rol = 'admin' | 'estudiante';

export interface Usuario {
  id: number;
  rut: string;
  nombre: string;
  email: string;
  rol: Rol;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosAdminService {
  private base = `${environment.API_URL}/usuarios`;

  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<{ data: Usuario[] }>(this.base);
  }

  getOne(id: number) {
    return this.http.get<{ data: Usuario }>(`${this.base}/${id}`);
  }

  create(body: { rut: string; nombre: string; email: string; password: string; rol?: Rol }) {
    return this.http.post<{ data: Usuario }>(this.base, body);
  }

  update(id: number, body: Partial<{ rut: string; nombre: string; email: string; password: string; rol: Rol }>) {
    return this.http.put<{ data: Usuario }>(`${this.base}/${id}`, body);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
