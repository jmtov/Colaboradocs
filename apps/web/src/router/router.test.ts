// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
  adminPath,
  deckPath,
  documentPath,
  editPath,
  navigate,
  pathname,
  resolveRoute,
  skipsPageTransition,
  slideFromSearch,
  withSlide,
} from './router';

describe('resolveRoute', () => {
  it('/p/<id> abre una presentación', () => {
    expect(resolveRoute('/p/charla')).toEqual({ kind: 'deck', id: 'charla' });
    expect(resolveRoute('/p/charla/')).toEqual({ kind: 'deck', id: 'charla' });
    expect(resolveRoute('/p/charla/editar')).toEqual({
      kind: 'deck-edit',
      id: 'charla',
    });
    expect(resolveRoute('/p/a/b')).toEqual({ kind: 'missing' });
    expect(deckPath('mi charla')).toBe('/p/mi%20charla');
  });

  it('/ es la home', () => {
    expect(resolveRoute('/')).toEqual({ kind: 'home' });
    expect(resolveRoute('')).toEqual({ kind: 'home' });
  });

  it('/tareas es «Mis tareas», con o sin barra final', () => {
    expect(resolveRoute('/tareas')).toEqual({ kind: 'tasks' });
    expect(resolveRoute('/tareas/')).toEqual({ kind: 'tasks' });
  });

  it('/d/<id> abre ese documento, con o sin barra final', () => {
    expect(resolveRoute('/d/principios')).toEqual({
      kind: 'document',
      id: 'principios',
    });
    expect(resolveRoute('/d/principios/')).toEqual({
      kind: 'document',
      id: 'principios',
    });
  });

  it('/d/<id>/editar abre el editor de ese documento', () => {
    expect(resolveRoute('/d/principios/editar')).toEqual({
      kind: 'edit',
      id: 'principios',
    });
    expect(resolveRoute('/d/mi%20doc/editar/')).toEqual({
      kind: 'edit',
      id: 'mi doc',
    });
    expect(editPath('mi doc')).toBe('/d/mi%20doc/editar');
    expect(resolveRoute('/d/principios/otra')).toEqual({ kind: 'missing' });
  });

  it('decodifica el id', () => {
    expect(resolveRoute('/d/mi%20doc')).toEqual({
      kind: 'document',
      id: 'mi doc',
    });
  });

  it('/accesos es la página de administración; /documentos ya no existe (todo se maneja en la home)', () => {
    expect(resolveRoute('/documentos')).toEqual({ kind: 'missing' });
    expect(resolveRoute('/accesos/')).toEqual({
      kind: 'admin',
      page: 'access',
    });
    expect(adminPath('access')).toBe('/accesos');
  });

  it('lo demás no existe', () => {
    expect(resolveRoute('/accesos/otra')).toEqual({ kind: 'missing' });
    expect(resolveRoute('/otra/cosa')).toEqual({ kind: 'missing' });
    expect(resolveRoute('/d/')).toEqual({ kind: 'missing' });
    expect(resolveRoute('/d/%E0%A4%A')).toEqual({ kind: 'missing' });
  });

  it('documentPath codifica el id', () => {
    expect(documentPath('mi doc')).toBe('/d/mi%20doc');
  });
});

describe('navigate', () => {
  it('cambia la ruta y con replace no suma historial', () => {
    const before = window.history.length;
    navigate('/d/uno');
    expect(pathname()).toBe('/d/uno');
    expect(window.history.length).toBe(before + 1);
    navigate('/d/dos', { replace: true });
    expect(pathname()).toBe('/d/dos');
    expect(window.history.length).toBe(before + 1);
  });
});

describe('skipsPageTransition', () => {
  it('las redirecciones y el cambio de tab no se animan; navegar y volver sí', () => {
    expect(skipsPageTransition('replace')).toBe(true);
    expect(skipsPageTransition('tab')).toBe(true);
    expect(skipsPageTransition('push')).toBe(false);
    expect(skipsPageTransition('pop')).toBe(false);
  });
});

describe('rutas de los tabs de la home', () => {
  it('/presentaciones y /tareas son tabs, con o sin barra final', () => {
    expect(resolveRoute('/presentaciones')).toEqual({ kind: 'decks' });
    expect(resolveRoute('/presentaciones/')).toEqual({ kind: 'decks' });
    expect(resolveRoute('/tareas')).toEqual({ kind: 'tasks' });
  });
});

describe('la slide en la URL', () => {
  it('withSlide la agrega y slideFromSearch la lee (desde 1)', () => {
    expect(withSlide('/p/charla', 4)).toBe('/p/charla?slide=4');
    expect(slideFromSearch('?slide=4')).toBe(4);
    expect(slideFromSearch('')).toBeUndefined();
    expect(slideFromSearch('?slide=0')).toBeUndefined();
    expect(slideFromSearch('?slide=abc')).toBeUndefined();
    expect(slideFromSearch('?slide=2.5')).toBeUndefined();
  });

  it('navegar a una ruta con ?slide no cambia la ruta que se resuelve', () => {
    expect(resolveRoute('/p/charla/editar')).toEqual({
      kind: 'deck-edit',
      id: 'charla',
    });
  });
});
