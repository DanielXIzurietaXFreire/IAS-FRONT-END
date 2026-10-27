import { HttpErrorResponse } from '@angular/common/http';

import { CamarasComponent } from './camaras.component';

/**
 * Qué ve el operador en la pantalla de cámaras cuando la API responde con un error.
 *
 * El backend devuelve 404 cuando la cámara ya no existe (tres pruebas de integración lo
 * comprueban desde el 14/10/2026), pero nadie comprobaba que la pantalla **dijera algo**.
 * Un error sin mensaje deja al operador mirando una tabla que no cambia.
 */
describe('CamarasComponent: mensajes de error', () => {
  const manejar = (estado: number, cuerpo: unknown = null) => {
    const salidas = { cerroSesion: false, fueA: '' };
    const contexto = {
      loading: true,
      message: '',
      authService: { logout: () => (salidas.cerroSesion = true) },
      router: { navigate: (ruta: string[]) => (salidas.fueA = ruta.join('/')) }
    };

    // handleError es privado: se invoca por el prototipo, que es lo que hace Angular.
    (CamarasComponent.prototype as never as Record<string, (e: HttpErrorResponse) => void>)
      ['handleError'].call(contexto, new HttpErrorResponse({ status: estado, error: cuerpo }));

    return { ...salidas, mensaje: contexto.message, cargando: contexto.loading };
  };

  it('con 404 avisa de que la cámara no existe', () => {
    expect(manejar(404).mensaje).toBe('La cámara solicitada no fue encontrada.');
  });

  it('con 403 avisa de que faltan permisos', () => {
    expect(manejar(403).mensaje).toBe('No tienes permisos para realizar esta acción.');
  });

  it('con 409 muestra el motivo que manda el backend', () => {
    const mensaje = manejar(409, 'No se puede eliminar la cámara porque tiene alertas registradas.').mensaje;

    expect(mensaje).toContain('alertas registradas');
  });

  it('con 409 sin cuerpo, explica el motivo de todas formas', () => {
    expect(manejar(409).mensaje).toContain('alertas registradas');
  });

  it('con 401 cierra la sesión y lleva al login, sin dejar un mensaje colgado', () => {
    const resultado = manejar(401);

    expect(resultado.cerroSesion).toBeTrue();
    expect(resultado.fueA).toBe('/login');
    expect(resultado.mensaje).toBe('');
  });

  it('con un error cualquiera no se queda en silencio', () => {
    expect(manejar(500).mensaje).toBe('No se pudo completar la operación. Inténtalo de nuevo.');
  });

  it('cualquier error deja de mostrar el indicador de carga', () => {
    for (const estado of [403, 404, 409, 500]) {
      expect(manejar(estado).cargando).toBeFalse();
    }
  });
});
