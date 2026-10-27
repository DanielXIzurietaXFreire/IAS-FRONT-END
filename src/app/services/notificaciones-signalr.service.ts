import { Injectable, NgZone, OnDestroy } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel
} from '@microsoft/signalr';
import type { SecurityNotification } from './notification.service';
import { AudioService } from './audio.service';

export type NotificationEventCallback = (notification: SecurityNotification) => void;

@Injectable({ providedIn: 'root' })
export class NotificacionesSignalRService implements OnDestroy {
  private readonly connection: HubConnection;
  private readonly nuevaCallbacks = new Set<NotificationEventCallback>();
  private readonly actualizadaCallbacks = new Set<NotificationEventCallback>();
  private startPromise: Promise<void> | null = null;

  constructor(
    private readonly zone: NgZone,
    private readonly audioService: AudioService
  ) {
    this.connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5014/notificationHub', {
        transport: HttpTransportType.WebSockets,
        skipNegotiation: true
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Information)
      .build();

    this.connection.on('NuevaNotificacion', (notification: SecurityNotification) => {
      this.zone.run(() => {
        this.nuevaCallbacks.forEach(callback => callback(notification));
        this.audioService.playNotificationSound();
      });
    });
    this.connection.on('NotificacionActualizada', (notification: SecurityNotification) => {
      this.zone.run(() => this.actualizadaCallbacks.forEach(callback => callback(notification)));
    });

    this.connection.onreconnecting(error => console.warn('SignalR reconectando:', error));
    this.connection.onreconnected(connectionId => console.info('SignalR reconectado:', connectionId));
    this.connection.onclose(error => console.error('SignalR cerrado:', error));
  }

  startConnection(): Promise<void> {
    if (this.connection.state === HubConnectionState.Connected) return Promise.resolve();
    if (this.startPromise) return this.startPromise;

    this.startPromise = this.connection.start()
      .then(() => console.info('SignalR conectado'))
      .catch(error => {
        console.error('Error al conectar SignalR:', error);
        throw error;
      })
      .finally(() => { this.startPromise = null; });

    return this.startPromise;
  }

  stopConnection(): Promise<void> {
    this.startPromise = null;
    const stopPromise = this.connection.state === HubConnectionState.Disconnected
      ? Promise.resolve()
      : this.connection.stop();
    this.nuevaCallbacks.clear();
    this.actualizadaCallbacks.clear();
    return stopPromise.catch(error => {
      console.error('Error al detener SignalR:', error);
      throw error;
    });
  }

  onNuevaNotificacion(callback: NotificationEventCallback): void {
    this.nuevaCallbacks.add(callback);
  }

  onNotificacionActualizada(callback: NotificationEventCallback): void {
    this.actualizadaCallbacks.add(callback);
  }

  getConnectionState(): HubConnectionState {
    return this.connection.state;
  }

  ngOnDestroy(): void {
    this.nuevaCallbacks.clear();
    this.actualizadaCallbacks.clear();
    this.connection.off('NuevaNotificacion');
    this.connection.off('NotificacionActualizada');
    void this.stopConnection();
  }
}
