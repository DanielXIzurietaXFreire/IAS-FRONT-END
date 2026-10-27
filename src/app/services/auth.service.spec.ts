import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const url = 'http://localhost:5014/api/auth/login';

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [AuthService] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('envía el correo y la contraseña al backend', () => {
    service.login('operador@sisa.fin.ec', 'clave').subscribe();

    const peticion = http.expectOne(url);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ email: 'operador@sisa.fin.ec', password: 'clave' });
    peticion.flush({ token: 'jwt' });
  });

  it('guarda el token que devuelve el backend en el campo token', () => {
    service.login('operador@sisa.fin.ec', 'clave').subscribe();
    http.expectOne(url).flush({ token: 'jwt-de-supabase', usuario: { nombre: 'Operador' } });

    expect(localStorage.getItem('token')).toBe('jwt-de-supabase');
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getUserName()).toBe('Operador');
  });

  it('sin sesión iniciada no hay token ni usuario autenticado', () => {
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('cerrar sesión borra el token y el usuario', () => {
    localStorage.setItem('token', 'jwt');
    localStorage.setItem('user', '{"nombre":"Operador"}');

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('saca el nombre del token cuando no hay usuario guardado', () => {
    const carga = btoa(JSON.stringify({ email: 'operador@sisa.fin.ec' }));
    localStorage.setItem('token', 'cabecera.' + carga + '.firma');

    expect(service.getUserName()).toBe('operador@sisa.fin.ec');
  });

  it('con un usuario guardado ilegible no revienta', () => {
    localStorage.setItem('user', 'esto-no-es-json');

    expect(service.getUserName()).toBe('usuario');
  });
});
