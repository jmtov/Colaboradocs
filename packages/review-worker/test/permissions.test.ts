import { permissionForAdminRoute } from '@colaboradocs/review-core';
import { describe, expect, it } from 'vitest';
import app from '../src/index';

describe('tabla de permisos', () => {
  it('toda ruta /admin/* del Worker tiene su permiso: ninguna se queda sin nombre', () => {
    const adminRoutes = app.routes.filter(
      (route) => route.path.includes('/admin/') && route.method !== 'ALL',
    );
    expect(adminRoutes.length).toBeGreaterThan(20);
    for (const route of adminRoutes) {
      expect(
        permissionForAdminRoute(route.method, route.path),
        `${route.method} ${route.path}`,
      ).not.toBeNull();
    }
  });
});
