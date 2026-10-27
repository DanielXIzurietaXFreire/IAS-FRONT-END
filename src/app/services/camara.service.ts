import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Camara, CamaraInput } from '../models/camara.model';

@Injectable({ providedIn: 'root' })
export class CamaraService {
  private readonly apiUrl = 'http://localhost:5014/api/camaras';

  constructor(private readonly http: HttpClient) {}

  getCamaras(): Observable<Camara[]> {
    return this.http.get<Camara[]>(this.apiUrl);
  }

  getCamaraById(id: number): Observable<Camara> {
    return this.http.get<Camara>(`${this.apiUrl}/${id}`);
  }

  createCamara(camara: CamaraInput): Observable<Camara> {
    return this.http.post<Camara>(this.apiUrl, camara);
  }

  updateCamara(id: number, camara: CamaraInput): Observable<Camara> {
    return this.http.put<Camara>(`${this.apiUrl}/${id}`, camara);
  }

  deleteCamara(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}