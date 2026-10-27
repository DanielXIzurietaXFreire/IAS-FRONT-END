import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NotificationCounts, NotificationService, NotificationStatus, SecurityNotification } from '../../services/notification.service';
import { NotificacionesSignalRService } from '../../services/notificaciones-signalr.service';

@Component({ selector: 'app-dashboard', standalone: false, templateUrl: './dashboard.component.html', styleUrl: './dashboard.component.css' })
export class DashboardComponent implements OnInit, OnDestroy {
  readonly userName: string;
  notifications: SecurityNotification[] = [];
  selectedNotification: SecurityNotification | null = null;
  counts: NotificationCounts = { todas: 0, pendiente: 0, revisado: 0, descartado: 0 };
  private subscription?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly signalRService: NotificacionesSignalRService
  ) { this.userName = this.authService.getUserName(); }
  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe(items => this.notifications = items);
    this.signalRService.onNuevaNotificacion(this.handleNuevaNotificacion);
    this.signalRService.onNotificacionActualizada(this.handleNotificacionActualizada);
    void this.signalRService.startConnection().catch(() => undefined);
    this.notificationService.listar({ orden: 'desc', page: 1, pageSize: 20 }).subscribe();
    this.loadCounts();
  }
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    void this.signalRService.stopConnection();
  }
  get pending(): number { return this.counts.pendiente; }
  get reviewed(): number { return this.counts.revisado; }
  get dismissed(): number { return this.counts.descartado; }
  get activeNotifications(): SecurityNotification[] { return this.notifications.filter(item => item.estado !== 'descartado').sort((a, b) => b.timestamp - a.timestamp).slice(0, 5); }
  openDetails(item: SecurityNotification): void { this.selectedNotification = item; }
  closeDetails(): void { this.selectedNotification = null; }
  updateStatus(status: NotificationStatus): void { if (this.selectedNotification && status !== 'pendiente') { this.notificationService.actualizarEstado(this.selectedNotification.id, status).subscribe(); this.closeDetails(); } }
  statusLabel(status: string): string { return status === 'revisado' ? 'Revisada' : status === 'descartado' ? 'Descartada' : 'Pendiente'; }
  private loadCounts(): void { this.notificationService.getCounts().subscribe({ next: counts => this.counts = counts }); }
  private readonly handleNuevaNotificacion = (notification: SecurityNotification): void => {
    this.notificationService.upsertRealtimeNotification(notification);
    this.loadCounts();
  };
  private readonly handleNotificacionActualizada = (notification: SecurityNotification): void => {
    this.notificationService.upsertRealtimeNotification(notification, false);
    this.loadCounts();
  };
  @HostListener('document:keydown.escape') closeOnEscape(): void { if (this.selectedNotification) this.closeDetails(); }
}
