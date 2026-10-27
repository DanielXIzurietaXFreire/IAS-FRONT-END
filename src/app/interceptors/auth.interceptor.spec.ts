import { TestBed } from '@angular/core/testing';
import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let control: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
      ]
    });
    http = TestBed.inject(HttpClient);
    control = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    control.verify();
    localStorage.clear();
  });

  it('añade el token a las peticiones protegidas', () => {
    localStorage.setItem('token', 'jwt');

    http.get('http://localhost:5014/api/notificaciones').subscribe();

    const peticion = control.expectOne('http://localhost:5014/api/notificaciones');
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer jwt');
    peticion.flush({});
  });

  it('no manda token en el inicio de sesión, porque todavía no existe', () => {
    localStorage.setItem('token', 'jwt');

    http.post('http://localhost:5014/api/auth/login', {}).subscribe();

    const peticion = control.expectOne('http://localhost:5014/api/auth/login');
    expect(peticion.request.headers.has('Authorization')).toBeFalse();
    peticion.flush({ token: 'jwt' });
  });

  it('sin token guardado, la petición sale tal cual', () => {
    http.get('http://localhost:5014/api/camaras').subscribe();

    const peticion = control.expectOne('http://localhost:5014/api/camaras');
    expect(peticion.request.headers.has('Authorization')).toBeFalse();
    peticion.flush([]);
  });
});
