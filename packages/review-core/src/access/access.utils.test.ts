import { describe, expect, it } from 'vitest';
import { type AccessNode, lockedReviewerIds } from './access.utils';

const root: AccessNode = { id: 'root', isAdmin: true, promotedBy: null };
const b: AccessNode = { id: 'b', isAdmin: true, promotedBy: 'root' };
const c: AccessNode = { id: 'c', isAdmin: true, promotedBy: 'b' };
const d: AccessNode = { id: 'd', isAdmin: true, promotedBy: 'root' };
const member: AccessNode = { id: 'm', isAdmin: false, promotedBy: null };

describe('lockedReviewerIds', () => {
  it('bloquea a la persona misma y a toda su cadena de ancestros', () => {
    const locked = lockedReviewerIds([root, b, c, d, member], 'c');
    expect([...locked].sort()).toEqual(['b', 'c', 'root']);
  });

  it('no deja que un descendiente toque a la raíz aunque no la haya hecho directamente', () => {
    expect(lockedReviewerIds([root, b, c], 'c').has('root')).toBe(true);
  });

  it('un admin no toca a sus pares ni a sus descendientes: sí, a quien no es de su cadena', () => {
    const locked = lockedReviewerIds([root, b, c, d], 'b');
    expect(locked.has('d')).toBe(false);
    expect(locked.has('c')).toBe(false);
  });

  it('los admins creados por CLI quedan bloqueados para todos', () => {
    const other: AccessNode = { id: 'r2', isAdmin: true, promotedBy: null };
    expect(lockedReviewerIds([root, other, b], 'b').has('r2')).toBe(true);
  });

  it('quien no es admin no bloquea a miembros comunes', () => {
    expect(lockedReviewerIds([root, member], 'root').has('m')).toBe(false);
  });

  it('tolera ciclos en promotedBy', () => {
    const x: AccessNode = { id: 'x', isAdmin: true, promotedBy: 'y' };
    const y: AccessNode = { id: 'y', isAdmin: true, promotedBy: 'x' };
    expect([...lockedReviewerIds([x, y], 'x')].sort()).toEqual(['x', 'y']);
  });
});
