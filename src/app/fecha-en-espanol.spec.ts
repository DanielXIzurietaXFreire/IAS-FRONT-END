import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { DatePipe, formatDate, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { AppModule } from './app.module';

/**
 * Las fechas de las alertas salían en inglés («Wednesday, October 7, 2026»), porque Angular
 * usa en-US cuando no se registra otro idioma. El sistema lo usa personal de seguridad en
 * Ecuador. Estas pruebas comprueban las dos mitades del arreglo: que el idioma español está
 * registrado y empaquetado, y que la aplicación lo tiene fijado como suyo.
 */
describe('Fechas en español', () => {
  const sieteDeOctubre = new Date(2026, 9, 7, 15, 30);

  beforeAll(() => registerLocaleData(localeEs));

  it('el idioma español está registrado y disponible', () => {
    const texto = formatDate(sieteDeOctubre, 'fullDate', 'es');

    expect(texto).toContain('octubre');
    expect(texto).toContain('miércoles');
    expect(texto).not.toContain('October');
  });

  it('la aplicación declara el español como su idioma', () => {
    // Si alguien quita el proveedor de LOCALE_ID del AppModule, esta prueba falla.
    TestBed.configureTestingModule({ imports: [AppModule] });

    expect(TestBed.inject(LOCALE_ID)).toBe('es');
  });

  it('con ese idioma, la tubería de fecha escribe en español', () => {
    TestBed.configureTestingModule({
      providers: [DatePipe, { provide: LOCALE_ID, useValue: 'es' }]
    });

    const resultado = TestBed.inject(DatePipe).transform(sieteDeOctubre, 'fullDate');

    expect(resultado).toContain('octubre');
  });
});
