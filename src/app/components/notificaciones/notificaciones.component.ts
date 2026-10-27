import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NotificationService, NotificationStatus, SecurityNotification } from '../../services/notification.service';
import { NotificacionesSignalRService } from '../../services/notificaciones-signalr.service';

@Component({ selector: 'app-notificaciones', standalone: false, templateUrl: './notificaciones.component.html', styleUrl: './notificaciones.component.css' })
export class NotificacionesComponent implements OnInit, OnDestroy {
  notifications: SecurityNotification[] = [];
  filter: 'todas' | NotificationStatus = 'todas';
  order: 'reciente' | 'antiguo' = 'reciente';
  search = '';
  loading = false;
  readonly pageSize = 20;
  page = 1;
  totalPages = 1;
  selectedNotification: SecurityNotification | null = null;
  private subscription?: Subscription;
  private routeSubscription?: Subscription;
  constructor(
    private readonly notificationService: NotificationService,
    private readonly signalRService: NotificacionesSignalRService,
    private readonly route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe(items => this.notifications = items);
    this.signalRService.onNuevaNotificacion(this.handleNuevaNotificacion);
    this.signalRService.onNotificacionActualizada(this.handleNotificacionActualizada);
    void this.signalRService.startConnection().catch(() => undefined);
    this.routeSubscription = this.route.queryParams.subscribe(params => {
      const requestedFilter = params['filtro'];
      if (['todas', 'pendiente', 'revisado', 'descartado'].includes(requestedFilter)) this.filter = requestedFilter;
      this.loadNotifications();
    });
  }
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
    void this.signalRService.stopConnection();
  }
  /**
   * En la vista «Todas» se ordena PRIMERO por estado y después por fecha. No es un
   * descuido: es la priorización de las pendientes, que es lo que el operador necesita ver
   * arriba, y la captura del 3.4.3 de la tesis lo muestra así.
   *
   * CONGELADO (14/10/2026, decisión del REVISOR y del autor): no se cambia el orden. Si
   * algún día se mejora, se mejora el **separador** (cabeceras por estado), no el orden.
   */
  get filteredNotifications(): SecurityNotification[] {
    const priority: Record<NotificationStatus, number> = {
      pendiente: 0,
      revisado: 1,
      descartado: 2
    };
    return [...this.notifications].sort((first, second) => {
      if (this.filter === 'todas' && priority[first.estado] !== priority[second.estado]) {
        return priority[first.estado] - priority[second.estado];
      }
      return this.order === 'reciente'
        ? second.timestamp - first.timestamp
        : first.timestamp - second.timestamp;
    });
  }
  isDifferentDate(notification: SecurityNotification, index: number): boolean {
    if (index === 0) return true;
    return this.dateKey(notification.timestamp) !== this.dateKey(this.filteredNotifications[index - 1].timestamp);
  }

  /**
   * Fecha larga en español con solo la primera letra en mayúscula:
   * «Martes, 13 de octubre de 2026».
   *
   * El CSS lo hacía con text-transform: capitalize, que pone en mayúscula CADA palabra y
   * daba «Martes, 13 De Octubre De 2026». Y ::first-letter no sirve aquí, porque el primer
   * contenido del separador es el icono del calendario, no la letra (13/10/2026).
   */
  // La imagen ampliada se cerraba con el botón o pulsando fuera, pero no con Escape, que es
  // lo primero que intenta cualquiera. El panel ya lo hacía (14/10/2026).
  @HostListener('document:keydown.escape') cerrarConEscape(): void {
    if (this.selectedNotification) this.closeImage();
  }

  fechaLarga(timestamp: number): string {
    const texto = formatDate(timestamp, 'fullDate', 'es');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
  setStatus(id: number, status: NotificationStatus, event?: Event): void { event?.stopPropagation(); if (status !== 'pendiente') this.notificationService.actualizarEstado(id, status).subscribe(); }
  updateModalStatus(status: NotificationStatus): void { if (this.selectedNotification && status !== 'pendiente') { this.notificationService.actualizarEstado(this.selectedNotification.id, status).subscribe(); this.closeImage(); } }
  loadNotifications(page = 1): void {
    this.loading = true;
    this.notificationService.listar({
      estado: this.filter === 'todas' ? undefined : this.filter,
      search: this.search.trim() || undefined,
      orden: this.order === 'reciente' ? 'desc' : 'asc',
      page,
      pageSize: this.pageSize
    }).subscribe({
      next: result => {
        this.page = result.page || page;
        this.totalPages = Math.max(1, result.totalPages || 1);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
  previousPage(): void { if (this.page > 1) this.loadNotifications(this.page - 1); }
  nextPage(): void { if (this.page < this.totalPages) this.loadNotifications(this.page + 1); }
  openImage(item: SecurityNotification, event: Event): void { event.stopPropagation(); this.selectedNotification = item; }
  closeImage(): void { this.selectedNotification = null; }
  statusLabel(status: NotificationStatus): string { return status === 'revisado' ? 'Revisada' : status === 'descartado' ? 'Descartada' : 'Pendiente'; }

  private dateKey(timestamp: number): string { return new Date(timestamp).toDateString(); }

  private readonly handleNuevaNotificacion = (notification: SecurityNotification): void => {
    // Una alerta nueva pertenece a la primera página: en las demás no se intercala.
    if (this.page === 1) this.notificationService.upsertRealtimeNotification(notification);
  };

  private readonly handleNotificacionActualizada = (notification: SecurityNotification): void => {
    this.notificationService.upsertRealtimeNotification(notification, false);
  };
}
