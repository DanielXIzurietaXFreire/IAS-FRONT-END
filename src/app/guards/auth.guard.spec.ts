import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AuthGuard, LoginGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('Guards de acceso', () => {
  let authGuard: AuthGuard;
  let loginGuard: LoginGuard;
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    const espia = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated']);
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [AuthGuard, LoginGuard, { provide: AuthService, useValue: espia }]
    });
    authGuard = TestBed.inject(AuthGuard);
    loginGuard = TestBed.inject(LoginGuard);
    auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
  });

  it('deja entrar al usuario autenticado', () => {
    auth.isAuthenticated.and.returnValue(true);

    expect(authGuard.canActivate()).toBeTrue();
  });

  it('manda al login al usuario sin sesión', () => {
    auth.isAuthenticated.and.returnValue(false);

    const resultado = authGuard.canActivate();

    expect(resultado instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/login');
  });

  it('el que ya inició sesión no vuelve al formulario de login', () => {
    auth.isAuthenticated.and.returnValue(true);

    const resultado = loginGuard.canActivate();

    expect(router.serializeUrl(resultado as UrlTree)).toBe('/dashboard');
  });

  it('el que no ha iniciado sesión sí ve el formulario de login', () => {
    auth.isAuthenticated.and.returnValue(false);

    expect(loginGuard.canActivate()).toBeTrue();
  });
});
