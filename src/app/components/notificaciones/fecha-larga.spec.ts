import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { NotificacionesComponent } from './notificaciones.component';

/**
 * La fecha de los separadores salía como «Martes, 13 De Octubre De 2026», porque el CSS la
 * ponía en mayúscula con `text-transform: capitalize`, que capitaliza cada palabra. Ahora lo
 * hace `fechaLarga()`, y esta prueba fija cómo tiene que verse.
 */
describe('NotificacionesComponent.fechaLarga', () => {
  const martes13 = new Date(2026, 9, 13, 9, 15).getTime();

  // El método solo usa formatDate, así que no hace falta montar el componente entero.
  const fechaLarga = (ts: number) =>
    NotificacionesComponent.prototype.fechaLarga.call({}, ts);

  beforeAll(() => registerLocaleData(localeEs));

  it('pone en mayúscula solo la primera letra', () => {
    expect(fechaLarga(martes13)).toBe('Martes, 13 de octubre de 2026');
  });

  it('no capitaliza las preposiciones, que era el error', () => {
    const texto = fechaLarga(martes13);

    expect(texto).not.toContain(' De ');
    expect(texto).toContain(' de octubre de ');
  });

  it('escribe el mes en español', () => {
    expect(fechaLarga(martes13)).not.toContain('October');
  });
});

describe('NotificacionesComponent.cerrarConEscape', () => {
  it('con una imagen abierta, Escape la cierra', () => {
    const cerradas: string[] = [];
    const componente = {
      selectedNotification: { id: 7 },
      closeImage: () => cerradas.push('cerrada')
    };

    NotificacionesComponent.prototype.cerrarConEscape.call(componente);

    expect(cerradas).toEqual(['cerrada']);
  });

  it('sin imagen abierta, Escape no hace nada', () => {
    const cerradas: string[] = [];
    const componente = { selectedNotification: null, closeImage: () => cerradas.push('cerrada') };

    NotificacionesComponent.prototype.cerrarConEscape.call(componente);

    expect(cerradas).toEqual([]);
  });
});
