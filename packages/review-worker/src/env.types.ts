import type { Reviewer } from '@juntanza/review-core';

export type Bindings = {
  DB: D1Database;
  /** Firma los tokens y sirve de pimienta del hash de los PIN. */
  TOKEN_SECRET: string;
};

export type Variables = {
  reviewer: Reviewer;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
