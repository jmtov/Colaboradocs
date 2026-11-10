import { describe, expect, it } from 'vitest';
import { sheetShift, translateYOf } from './sheet.utils';

describe('translateYOf', () => {
  it('lee el desplazamiento vertical de matrix() y matrix3d()', () => {
    expect(translateYOf('matrix(1, 0, 0, 1, 0, 248)')).toBe(248);
    expect(translateYOf('matrix(1, 0, 0, 1, 0, -12.5)')).toBe(-12.5);
    expect(translateYOf('matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,300,0,1)')).toBe(
      300,
    );
  });

  it('none, vacío o ilegible: 0', () => {
    expect(translateYOf('none')).toBe(0);
    expect(translateYOf('')).toBe(0);
    expect(translateYOf(undefined)).toBe(0);
    expect(translateYOf('translateY(10px)')).toBe(0);
  });
});

describe('sheetShift', () => {
  // Viewport de 593px de alto; la hoja mide 248px y está pegada abajo.
  const visibleBottom = 593;

  it('hoja en su lugar, sin teclado: no hay que desplazarla', () => {
    expect(
      sheetShift({ measuredBottom: 593, transform: 'none', visibleBottom }),
    ).toBe(0);
  });

  it('REGRESIÓN: al empezar a entrar la hoja está fuera de pantalla (translateY = su alto); eso no es un desplazamiento a corregir', () => {
    // Medida en pantalla: 593 + 248 = 841; sin la animación, estaría en 593.
    expect(
      sheetShift({
        measuredBottom: 841,
        transform: 'matrix(1, 0, 0, 1, 0, 248)',
        visibleBottom,
      }),
    ).toBe(0);
  });

  it('a mitad de la animación tampoco', () => {
    expect(
      sheetShift({
        measuredBottom: 593 + 120,
        transform: 'matrix(1, 0, 0, 1, 0, 120)',
        visibleBottom,
      }),
    ).toBe(0);
  });

  it('con el teclado abierto sí se corrige: el viewport visible termina más arriba', () => {
    // teclado de 300px: el viewport visible acaba en 293 y la hoja (sin transformar) en 593
    expect(
      sheetShift({
        measuredBottom: 593,
        transform: 'none',
        visibleBottom: 293,
      }),
    ).toBe(-300);
  });

  it('con el teclado abierto y un desplazamiento previo, el resultado es absoluto (no se acumula)', () => {
    expect(
      sheetShift({
        measuredBottom: 293,
        transform: 'matrix(1, 0, 0, 1, 0, -300)',
        visibleBottom: 293,
      }),
    ).toBe(-300);
  });
});
