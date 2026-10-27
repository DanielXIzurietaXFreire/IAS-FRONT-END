import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { NotificationService, SecurityNotification } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;
  const url = 'http://localhost:5014/api/notificaciones';

  const alerta = (cambios: Partial<SecurityNotification> = {}): SecurityNotification => ({
    id: 7,
    mensaje: 'Arma detectada en zona vigilada',
    timestamp: new Date('2026-09-26T15:30:00Z').getTime(),
    imagenUrl: 'https://storage/1.jpg',
    estado: 'pendiente',
    camaraId: 3,
    ...cambios
  });

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [NotificationService] });
    service = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('empieza sin ninguna notificación en pantalla', () => {
    expect(service.getNotifications()).toEqual([]);
  });

  it('traduce los filtros a parámetros de la petición', () => {
    service.listar({ estado: 'pendiente', search: 'Arma', orden: 'desc', page: 1, pageSize: 20 }).subscribe();

    const peticion = http.expectOne(r => r.url === url);
    expect(peticion.request.params.get('estado')).toBe('pendiente');
    expect(peticion.request.params.get('search')).toBe('Arma');
    expect(peticion.request.params.get('orden')).toBe('desc');
    peticion.flush({ items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 });
  });

  it('pide la página indicada y entrega el total de páginas que manda el backend', () => {
    let totalPaginas = 0;
    service.listar({ page: 3, pageSize: 20 }).subscribe(p => (totalPaginas = p.totalPages));

    const peticion = http.expectOne(r => r.url === url);
    expect(peticion.request.params.get('page')).toBe('3');
    expect(peticion.request.params.get('pageSize')).toBe('20');
    // Contrato con el backend: NotificacionesPage devuelve totalCount y totalPages.
    peticion.flush({ items: [alerta()], totalCount: 45, page: 3, pageSize: 20, totalPages: 3, hasNextPage: false });

    expect(totalPaginas).toBe(3);
  });

  it('no manda los filtros vacíos', () => {
    service.listar({ search: '' }).subscribe();

    const peticion = http.expectOne(r => r.url === url);
    expect(peticion.request.params.has('search')).toBeFalse();
    peticion.flush({ items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 });
  });

  it('publica en pantalla las notificaciones que llegan del backend', () => {
    let vistas: SecurityNotification[] = [];
    service.notifications$.subscribe(n => (vistas = n));

    service.listar().subscribe();
    http.expectOne(r => r.url === url).flush({
      items: [alerta()], totalCount: 1, page: 1, pageSize: 20, totalPages: 1
    });

    expect(vistas.length).toBe(1);
    expect(vistas[0].mensaje).toBe('Arma detectada en zona vigilada');
  });

  it('normaliza la fecha de texto a número y el estado a minúsculas', () => {
    service.listar().subscribe();
    http.expectOne(r => r.url === url).flush({
      items: [{ ...alerta(), timestamp: '2026-09-26T15:30:00Z' as unknown as number, estado: 'PENDIENTE' }],
      totalCount: 1, page: 1, pageSize: 20, totalPages: 1
    });

    const guardada = service.getNotifications()[0];
    expect(typeof guardada.timestamp).toBe('number');
    expect(guardada.estado).toBe('pendiente');
  });

  it('una alerta sin imagen ni cámara no deja huecos raros', () => {
    service.listar().subscribe();
    http.expectOne(r => r.url === url).flush({
      items: [{ ...alerta(), imagenUrl: null as unknown as string, camaraId: undefined as unknown as number }],
      totalCount: 1, page: 1, pageSize: 20, totalPages: 1
    });

    const guardada = service.getNotifications()[0];
    expect(guardada.imagenUrl).toBe('');
    expect(guardada.camaraId).toBeNull();
  });

  it('marcar como revisada actualiza la alerta en pantalla', () => {
    service.listar().subscribe();
    http.expectOne(r => r.url === url).flush({
      items: [alerta()], totalCount: 1, page: 1, pageSize: 20, totalPages: 1
    });

    service.actualizarEstado(7, 'revisado').subscribe();
    const peticion = http.expectOne(url + '/7/estado');
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual({ estado: 'revisado' });
    peticion.flush(alerta({ estado: 'revisado' }));

    expect(service.getNotifications()[0].estado).toBe('revisado');
  });

  it('si se está filtrando por pendientes, la revisada desaparece de la lista', () => {
    service.listar({ estado: 'pendiente' }).subscribe();
    http.expectOne(r => r.url === url).flush({
      items: [alerta()], totalCount: 1, page: 1, pageSize: 20, totalPages: 1
    });

    service.actualizarEstado(7, 'descartado').subscribe();
    http.expectOne(url + '/7/estado').flush(alerta({ estado: 'descartado' }));

    expect(service.getNotifications()).toEqual([]);
  });

  it('una alerta nueva por SignalR se pone arriba y avisa de que es nueva', () => {
    const esNueva = service.upsertRealtimeNotification(alerta({ id: 9 }));

    expect(esNueva).toBeTrue();
    expect(service.getNotifications()[0].id).toBe(9);
  });

  it('la misma alerta repetida por SignalR no se duplica ni vuelve a sonar', () => {
    service.upsertRealtimeNotification(alerta({ id: 9 }));

    const esNueva = service.upsertRealtimeNotification(alerta({ id: 9, estado: 'revisado' }));

    expect(esNueva).toBeFalse();
    expect(service.getNotifications().length).toBe(1);
    expect(service.getNotifications()[0].estado).toBe('revisado');
  });

  it('cuenta las notificaciones de cada estado con cuatro consultas', () => {
    let conteos: unknown;
    service.getCounts().subscribe(c => (conteos = c));

    const peticiones = http.match(r => r.url === url);
    expect(peticiones.length).toBe(4);
    peticiones.forEach((p, indice) => p.flush({
      items: [], totalCount: indice, page: 1, pageSize: 1, totalPages: 0
    }));

    expect(conteos).toEqual({ todas: 0, pendiente: 1, revisado: 2, descartado: 3 });
  });
});
