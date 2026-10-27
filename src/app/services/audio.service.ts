import { Injectable, isDevMode } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly soundUrl = '/assets/sounds/notification.mp3';
  private notificationAudio: HTMLAudioElement | null = null;
  private initialized = false;
  private pendingPlayback = false;

  init(): void {
    if (this.initialized) return;

    this.notificationAudio = new Audio(this.soundUrl);
    this.notificationAudio.preload = 'auto';
    this.notificationAudio.volume = 0.8;
    this.notificationAudio.load();

    this.initialized = true;
    void this.notificationAudio.play().then(() => {
      this.notificationAudio?.pause();
      if (this.notificationAudio) this.notificationAudio.currentTime = 0;
      if (this.pendingPlayback) {
        this.pendingPlayback = false;
        void this.playNotificationSound();
      }
    }).catch(error => {
      console.warn('No se pudo activar el sonido de notificaciones:', error);
    });
  }

  playNotificationSound(): Promise<boolean> {
    if (!this.notificationAudio) {
      this.pendingPlayback = true;
      if (isDevMode()) console.info('[Audio] Sonido pendiente: esperando el primer clic del usuario');
      return Promise.resolve(true);
    }

    this.notificationAudio.currentTime = 0;
    return this.notificationAudio.play().then(() => {
      this.logPlayback(true);
      return true;
    }).catch(error => {
      this.logPlayback(false, error instanceof Error ? error.message : 'Error desconocido');
      return false;
    });
  }

  private logPlayback(reproduced: boolean, reason?: string): void {
    if (!isDevMode()) return;
    if (reproduced) console.info('[Audio] Sonido reproducido');
    else console.warn(`[Audio] Sonido no reproducido${reason ? `: ${reason}` : ''}`);
  }
}
