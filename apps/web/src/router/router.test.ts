// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
  adminPath,
  documentPath,
  editPath,
  navigate,
  pathname,
  resolveRoute,
} from './router';

describe('resolveRoute', () => {
  it('/ es la home', () => {
    expect(resolveRoute('/')).toEqual({ kind: 'home' });
    expect(resolveRoute('')).toEqual({ kind: 'home' });
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

  it('/documentos y /accesos son las páginas de administración', () => {
    expect(resolveRoute('/documentos')).toEqual({
      kind: 'admin',
      page: 'documents',
    });
    expect(resolveRoute('/accesos/')).toEqual({
      kind: 'admin',
      page: 'access',
    });
    expect(adminPath('documents')).toBe('/documentos');
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
