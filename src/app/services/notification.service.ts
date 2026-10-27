import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, map, tap } from 'rxjs';

export type NotificationStatus = 'pendiente' | 'revisado' | 'descartado';

export interface SecurityNotification {
  id: number;
  mensaje: string;
  timestamp: number;
  imagenUrl: string;
  estado: NotificationStatus;
  camaraId: number | null;
  createdAt?: number;
  camara?: { nombre: string; ubicacion: string } | null;
}

export interface NotificationFilters {
  estado?: NotificationStatus;
  search?: string;
  orden?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface NotificationPage {
  items: SecurityNotification[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage?: boolean;
}

export interface NotificationCounts {
  todas: number;
  pendiente: number;
  revisado: number;
  descartado: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = 'http://localhost:5014/api/notificaciones';
  private readonly notificationsSubject = new BehaviorSubject<SecurityNotification[]>([]);
  readonly notifications$ = this.notificationsSubject.asObservable();
  private activeFilters: NotificationFilters = {};

  constructor(private readonly http: HttpClient) {}

  getNotifications(): SecurityNotification[] {
    return this.notificationsSubject.value;
  }

  listar(filters: NotificationFilters = {}): Observable<NotificationPage> {
    this.activeFilters = { ...filters };
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<NotificationPage>(this.apiUrl, { params }).pipe(
      tap(page => this.notificationsSubject.next(page.items.map(item => this.normalize(item))))
    );
  }

  obtenerPorId(id: number): Observable<SecurityNotification> {
    return this.http.get<SecurityNotification>(`${this.apiUrl}/${id}`).pipe(
      tap(notification => this.updateLocal(this.normalize(notification)))
    );
  }

  actualizarEstado(id: number, estado: Exclude<NotificationStatus, 'pendiente'>): Observable<SecurityNotification | null> {
    return this.http.put<SecurityNotification | null>(`${this.apiUrl}/${id}/estado`, { estado }).pipe(
      tap(notification => notification
        ? this.updateLocal(this.normalize(notification))
        : this.updateLocalStatus(id, estado))
    );
  }

  getCounts(pageSize = 1): Observable<NotificationCounts> {
    const count = (estado?: NotificationStatus): Observable<number> => {
      let params = new HttpParams().set('page', '1').set('pageSize', String(pageSize));
      if (estado) params = params.set('estado', estado);
      return this.http.get<NotificationPage | SecurityNotification[]>(this.apiUrl, { params }).pipe(
        map(response => Array.isArray(response) ? response.length : this.readTotal(response))
      );
    };

    return forkJoin({
      todas: count(),
      pendiente: count('pendiente'),
      revisado: count('revisado'),
      descartado: count('descartado')
    });
  }

  private readTotal(page: NotificationPage): number {
    const response = page as NotificationPage & { total?: number; count?: number };
    return Number(response.totalCount ?? response.total ?? response.count ?? response.items?.length ?? 0);
  }

  upsertRealtimeNotification(notification: SecurityNotification, prepend = true): boolean {
    const normalized = this.normalize(notification);
    const existed = this.notificationsSubject.value.some(item => item.id === normalized.id);
    this.updateLocal(normalized, prepend);
    return !existed;
  }

  private normalize(notification: SecurityNotification): SecurityNotification {
    return {
      ...notification,
      timestamp: typeof notification.timestamp === 'number' ? notification.timestamp : new Date(notification.timestamp).getTime(),
      createdAt: notification.createdAt === undefined
        ? undefined
        : typeof notification.createdAt === 'number' ? notification.createdAt : new Date(notification.createdAt).getTime(),
      estado: String(notification.estado).toLowerCase() as NotificationStatus,
      imagenUrl: notification.imagenUrl || '',
      camaraId: notification.camaraId ?? null
    };
  }

  private updateLocal(notification: SecurityNotification, prepend = false): void {
    const current = this.notificationsSubject.value;
    const exists = current.some(item => item.id === notification.id);
    if (!this.matchesActiveFilters(notification)) {
      if (exists) this.notificationsSubject.next(current.filter(item => item.id !== notification.id));
      return;
    }
    const next = exists
      ? current.map(item => item.id === notification.id ? notification : item)
      : prepend ? [notification, ...current] : [...current, notification];
    this.notificationsSubject.next(next);
  }

  private updateLocalStatus(id: number, estado: Exclude<NotificationStatus, 'pendiente'>): void {
    const current = this.notificationsSubject.value;
    const notification = current.find(item => item.id === id);
    if (!notification) return;
    this.updateLocal({ ...notification, estado });
  }

  private matchesActiveFilters(notification: SecurityNotification): boolean {
    const { estado, search } = this.activeFilters;
    return (!estado || notification.estado === estado) &&
      (!search || notification.mensaje.toLowerCase().includes(search.toLowerCase()));
  }
}
