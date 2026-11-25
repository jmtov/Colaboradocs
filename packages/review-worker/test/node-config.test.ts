import { describe, expect, it } from 'vitest';
import {
  accountIdFromConfig,
  rebaseConfigPaths,
} from '../scripts/node-config.utils';

const CONFIG = `{
  "name": "docs",
  "account_id": "31e8ee318b93d1abf370d21daf888c38",
  "main": "src/index.ts",
  "assets": { "directory": "../../apps/web/dist" },
  "d1_databases": [{ "database_name": "docs", "migrations_dir": "migrations" }]
}`;

describe('accountIdFromConfig', () => {
  it('lee el account_id', () => {
    expect(accountIdFromConfig(CONFIG)).toBe(
      '31e8ee318b93d1abf370d21daf888c38',
    );
  });

  it('devuelve null si no lo trae o no parece uno', () => {
    expect(accountIdFromConfig('{ "name": "x" }')).toBeNull();
    expect(accountIdFromConfig('{ "account_id": "corto" }')).toBeNull();
  });
});

describe('rebaseConfigPaths', () => {
  const rebased = rebaseConfigPaths(
    CONFIG,
    '../../../../colaboradocs/packages/review-worker/',
  );

  it('reescribe las tres rutas al código', () => {
    expect(rebased).toContain(
      '"main": "../../../../colaboradocs/packages/review-worker/src/index.ts"',
    );
    expect(rebased).toContain(
      '"directory": "../../../../colaboradocs/packages/review-worker/../../apps/web/dist"',
    );
    expect(rebased).toContain(
      '"migrations_dir": "../../../../colaboradocs/packages/review-worker/migrations"',
    );
  });

  it('no toca lo demás', () => {
    expect(rebased).toContain('"name": "docs"');
    expect(rebased).toContain('"database_name": "docs"');
  });

  it('falla si falta una ruta, en vez de dejar la config a medias', () => {
    expect(() =>
      rebaseConfigPaths('{ "main": "src/index.ts" }', '../x'),
    ).toThrow();
  });
});
