import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '../api/review.api';
import { describeAccessError, describeLoginError } from './review.messages';

describe('describeLoginError', () => {
  it('traduce los errores conocidos del servidor', () => {
    expect(
      describeLoginError(new ApiRequestError('invalid_pin', 401)),
    ).toContain('PIN incorrecto');
    expect(
      describeLoginError(new ApiRequestError('device_limit', 403)),
    ).toContain('máximo de dispositivos');
    expect(describeLoginError(new ApiRequestError('network', 0))).toContain(
      'Sin conexión',
    );
  });

  it('en los casos raros muestra el detalle técnico para poder diagnosticar', () => {
    expect(
      describeLoginError(new ApiRequestError('invalid_request', 500)),
    ).toContain('invalid_request, 500');
    expect(describeLoginError(new TypeError('x is not a function'))).toContain(
      'x is not a function',
    );
  });
});

describe('describeAccessError', () => {
  it('traduce los errores de la pantalla de accesos', () => {
    expect(
      describeAccessError(new ApiRequestError('name_taken', 409)),
    ).toContain('ese nombre');
    expect(
      describeAccessError(new ApiRequestError('forbidden', 403)),
    ).toContain('No puedes');
    expect(describeAccessError(new ApiRequestError('network', 0))).toContain(
      'Sin conexión',
    );
  });

  it('con un error desconocido da un mensaje genérico', () => {
    expect(describeAccessError(new Error('x'))).toBe(
      'No se pudo completar la acción.',
    );
  });
});
