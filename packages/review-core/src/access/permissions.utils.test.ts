import { describe, expect, it } from 'vitest';
import {
  can,
  canUseAdminRoute,
  PERMISSIONS,
  permissionForAdminRoute,
  ROLE_PERMISSIONS,
  roleOf,
} from './permissions.utils';

const admin = { isAdmin: true, isAgent: false };
const agent = { isAdmin: false, isAgent: true };
const person = { isAdmin: false, isAgent: false };

describe('roles', () => {
  it('cada persona tiene un rol', () => {
    expect([roleOf(admin), roleOf(agent), roleOf(person)]).toEqual([
      'admin',
      'agent',
      'member',
    ]);
  });

  it('el admin tiene todos los permisos; el agente y la persona, menos', () => {
    expect(ROLE_PERMISSIONS.admin).toEqual(PERMISSIONS);
    expect(can(agent, 'documents:publish')).toBe(true);
    expect(can(agent, 'access:admin')).toBe(false);
    expect(can(person, 'tasks:assign')).toBe(false);
    expect(can(person, 'documents:read')).toBe(true);
  });

  it('el agente no publica presentaciones', () => {
    expect(can(agent, 'decks:publish')).toBe(false);
    expect(can(agent, 'decks:draft')).toBe(true);
  });
});

describe('permissionForAdminRoute', () => {
  it('distingue leer o guardar un borrador de descartarlo y de publicar', () => {
    const draft = '/api/admin/documents/x/draft';
    expect(permissionForAdminRoute('GET', draft)).toBe('documents:draft');
    expect(permissionForAdminRoute('PUT', draft)).toBe('documents:draft');
    expect(permissionForAdminRoute('DELETE', draft)).toBe('documents:admin');
    expect(
      permissionForAdminRoute('POST', '/api/admin/documents/x/publish'),
    ).toBe('documents:publish');
    expect(permissionForAdminRoute('PUT', '/api/admin/documents/x')).toBe(
      'documents:admin',
    );
  });

  it('cubre presentaciones, temas, accesos y espacio', () => {
    expect(permissionForAdminRoute('PUT', '/api/admin/decks/d/draft')).toBe(
      'decks:draft',
    );
    expect(permissionForAdminRoute('POST', '/api/admin/decks/d/publish')).toBe(
      'decks:publish',
    );
    expect(
      permissionForAdminRoute('PUT', '/api/admin/decks/d/files/assets/a.png'),
    ).toBe('decks:admin');
    expect(
      permissionForAdminRoute('PUT', '/api/admin/themes/neutral/files/f.woff2'),
    ).toBe('themes:admin');
    expect(permissionForAdminRoute('POST', '/api/admin/reviewers/1/pin')).toBe(
      'access:admin',
    );
    expect(permissionForAdminRoute('PUT', '/api/admin/space')).toBe(
      'space:admin',
    );
  });

  it('una ruta que no está listada no exige un permiso: solo admins', () => {
    expect(permissionForAdminRoute('GET', '/api/admin/algo-nuevo')).toBeNull();
    expect(canUseAdminRoute(agent, 'GET', '/api/admin/algo-nuevo')).toBe(false);
    expect(canUseAdminRoute(admin, 'GET', '/api/admin/algo-nuevo')).toBe(true);
  });
});

describe('canUseAdminRoute', () => {
  it('un admin entra a todo', () => {
    expect(
      canUseAdminRoute(admin, 'POST', '/api/admin/documents/x/publish'),
    ).toBe(true);
    expect(canUseAdminRoute(admin, 'DELETE', '/api/admin/reviewers/abc')).toBe(
      true,
    );
  });

  it('el agente lee y guarda borradores y publica documentos', () => {
    expect(canUseAdminRoute(agent, 'GET', '/api/admin/documents/x/draft')).toBe(
      true,
    );
    expect(canUseAdminRoute(agent, 'PUT', '/api/admin/decks/d/draft')).toBe(
      true,
    );
    expect(
      canUseAdminRoute(agent, 'POST', '/api/admin/documents/x/publish'),
    ).toBe(true);
  });

  it('el agente no hace lo demás', () => {
    for (const [method, path] of [
      ['POST', '/api/admin/decks/d/publish'],
      ['DELETE', '/api/admin/documents/x/draft'],
      ['PUT', '/api/admin/documents/x'],
      ['DELETE', '/api/admin/decks/d'],
      ['POST', '/api/admin/reviewers'],
      ['PUT', '/api/admin/space'],
      ['PUT', '/api/admin/themes/neutral'],
      ['PUT', '/api/admin/decks/d/files/assets/a.png'],
    ] as const) {
      expect(canUseAdminRoute(agent, method, path), `${method} ${path}`).toBe(
        false,
      );
    }
  });

  it('una persona normal no entra a nada', () => {
    expect(
      canUseAdminRoute(person, 'GET', '/api/admin/documents/x/draft'),
    ).toBe(false);
  });
});
