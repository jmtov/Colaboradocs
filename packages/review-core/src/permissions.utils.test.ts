import { describe, expect, it } from 'vitest';
import { canManageTasks, canUseAdminRoute } from './permissions.utils';

const admin = { isAdmin: true, isAgent: false };
const agent = { isAdmin: false, isAgent: true };
const person = { isAdmin: false, isAgent: false };

describe('canUseAdminRoute', () => {
  it('un admin entra a todo', () => {
    expect(
      canUseAdminRoute(admin, 'POST', '/api/admin/documents/x/publish'),
    ).toBe(true);
    expect(canUseAdminRoute(admin, 'DELETE', '/api/admin/reviewers/abc')).toBe(
      true,
    );
  });

  it('el agente lee y guarda borradores de documentos y presentaciones', () => {
    expect(
      canUseAdminRoute(agent, 'GET', '/api/admin/documents/mi-doc/draft'),
    ).toBe(true);
    expect(
      canUseAdminRoute(agent, 'PUT', '/api/admin/documents/mi-doc/draft'),
    ).toBe(true);
    expect(
      canUseAdminRoute(agent, 'PUT', '/api/admin/decks/mi-deck/draft'),
    ).toBe(true);
  });

  it('el agente no publica, no descarta borradores ni toca accesos o el espacio', () => {
    expect(
      canUseAdminRoute(agent, 'POST', '/api/admin/documents/mi-doc/publish'),
    ).toBe(false);
    expect(
      canUseAdminRoute(agent, 'DELETE', '/api/admin/documents/mi-doc/draft'),
    ).toBe(false);
    expect(canUseAdminRoute(agent, 'PUT', '/api/admin/documents/mi-doc')).toBe(
      false,
    );
    expect(canUseAdminRoute(agent, 'DELETE', '/api/admin/decks/mi-deck')).toBe(
      false,
    );
    expect(canUseAdminRoute(agent, 'POST', '/api/admin/reviewers')).toBe(false);
    expect(canUseAdminRoute(agent, 'PUT', '/api/admin/space')).toBe(false);
    expect(canUseAdminRoute(agent, 'PUT', '/api/admin/themes/neutral')).toBe(
      false,
    );
    expect(
      canUseAdminRoute(
        agent,
        'PUT',
        '/api/admin/decks/mi-deck/files/assets/a.png',
      ),
    ).toBe(false);
  });

  it('una persona normal no entra a nada', () => {
    expect(
      canUseAdminRoute(person, 'GET', '/api/admin/documents/mi-doc/draft'),
    ).toBe(false);
  });
});

describe('canManageTasks', () => {
  it('admins y agentes sí; el resto no', () => {
    expect(canManageTasks(admin)).toBe(true);
    expect(canManageTasks(agent)).toBe(true);
    expect(canManageTasks(person)).toBe(false);
  });
});
