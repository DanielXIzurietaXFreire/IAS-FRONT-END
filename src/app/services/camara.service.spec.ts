import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CamaraService } from './camara.service';

describe('CamaraService', () => {
  let service: CamaraService;
  let http: HttpTestingController;
  const url = 'http://localhost:5014/api/camaras';
  const camara = { nombre: 'Caja', ubicacion: 'Planta baja', ip: '192.168.1.12', stream: 'rtsp://x' };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [CamaraService] });
    service = TestBed.inject(CamaraService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista las cámaras registradas', () => {
    let recibidas: unknown;
    service.getCamaras().subscribe(c => (recibidas = c));

    const peticion = http.expectOne(url);
    expect(peticion.request.method).toBe('GET');
    peticion.flush([{ id: 3, ...camara }]);

    expect(recibidas).toEqual([{ id: 3, ...camara }]);
  });

  it('consulta una cámara por su identificador', () => {
    service.getCamaraById(3).subscribe();

    expect(http.expectOne(url + '/3').request.method).toBe('GET');
  });

  it('crea una cámara con sus datos', () => {
    service.createCamara(camara).subscribe();

    const peticion = http.expectOne(url);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(camara);
    peticion.flush({ id: 4, ...camara });
  });

  it('actualiza una cámara existente', () => {
    service.updateCamara(3, camara).subscribe();

    const peticion = http.expectOne(url + '/3');
    expect(peticion.request.method).toBe('PUT');
    peticion.flush({ id: 3, ...camara });
  });

  it('elimina una cámara', () => {
    service.deleteCamara(3).subscribe();

    expect(http.expectOne(url + '/3').request.method).toBe('DELETE');
  });

  it('una cámara con alertas no se borra: el backend responde 409', () => {
    // Desde el 08/10/2026 la clave foránea es ON DELETE RESTRICT: borrar una cámara ya no
    // arrastra su historial de alertas. El backend responde 409 con un mensaje para el
    // operador, y el servicio lo deja pasar tal cual para que la pantalla lo muestre.
    let estado = 0;
    let mensaje = '';
    service.deleteCamara(3).subscribe({
      error: (error: { status: number; error: string }) => {
        estado = error.status;
        mensaje = error.error;
      }
    });

    http.expectOne(url + '/3').flush(
      'No se puede eliminar la cámara porque tiene alertas registradas. El historial de seguridad no se borra.',
      { status: 409, statusText: 'Conflict' });

    expect(estado).toBe(409);
    expect(mensaje).toContain('alertas registradas');
  });
});
