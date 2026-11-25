import type { Reviewer } from '../review/review.types';

/**
 * Las acciones del sistema. Un nivel de acceso (rol) es un conjunto de ellas.
 * `documents:read`, `decks:read` y `tasks:own` no las exigen las rutas (basta el PIN);
 * existen para etiquetar las herramientas del manual UTCP y decidir cuáles ve cada rol.
 */
export const PERMISSIONS = [
  'documents:read',
  'documents:draft',
  'documents:publish',
  'documents:admin',
  'decks:read',
  'decks:draft',
  'decks:publish',
  'decks:admin',
  'themes:admin',
  'tasks:own',
  'tasks:assign',
  'access:admin',
  'space:admin',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type Role = 'member' | 'agent' | 'admin';

const MEMBER: readonly Permission[] = [
  'documents:read',
  'decks:read',
  'tasks:own',
];

/**
 * Qué puede cada rol. `documents:admin` es subir o reemplazar directo y archivar;
 * `decks:admin`, crear, reemplazar o archivar un deck y subir sus archivos.
 * `documents:publish` del agente tiene condiciones que pone la ruta (ver el README).
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  member: MEMBER,
  agent: [
    ...MEMBER,
    'documents:draft',
    'documents:publish',
    'decks:draft',
    'tasks:assign',
  ],
  admin: PERMISSIONS,
};

export function roleOf(reviewer: Pick<Reviewer, 'isAdmin' | 'isAgent'>): Role {
  if (reviewer.isAdmin) return 'admin';
  return reviewer.isAgent ? 'agent' : 'member';
}

export function can(
  reviewer: Pick<Reviewer, 'isAdmin' | 'isAgent'>,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[roleOf(reviewer)].includes(permission);
}

type AdminRoute = {
  methods: string[] | '*';
  pattern: RegExp;
  permission: Permission;
};

const READ_WRITE = ['GET', 'PUT'];

/**
 * Qué permiso exige cada ruta `/admin/*`; gana la primera que coincide. Una ruta que
 * no esté aquí no la usa nadie salvo un admin (negar por omisión), y una prueba
 * comprueba que ninguna ruta real quede sin listar.
 */
const ADMIN_ROUTES: AdminRoute[] = [
  {
    methods: READ_WRITE,
    pattern: /\/admin\/documents\/[^/]+\/draft$/,
    permission: 'documents:draft',
  },
  {
    methods: ['POST'],
    pattern: /\/admin\/documents\/[^/]+\/publish$/,
    permission: 'documents:publish',
  },
  {
    methods: '*',
    pattern: /\/admin\/documents\/[^/]+(\/draft)?$/,
    permission: 'documents:admin',
  },
  {
    methods: READ_WRITE,
    pattern: /\/admin\/decks\/[^/]+\/draft$/,
    permission: 'decks:draft',
  },
  {
    methods: ['POST'],
    pattern: /\/admin\/decks\/[^/]+\/publish$/,
    permission: 'decks:publish',
  },
  {
    methods: '*',
    pattern: /\/admin\/decks\/[^/]+(\/draft|\/files\/.*)?$/,
    permission: 'decks:admin',
  },
  {
    methods: '*',
    pattern: /\/admin\/themes(\/.*)?$/,
    permission: 'themes:admin',
  },
  {
    methods: '*',
    pattern: /\/admin\/reviewers(\/.*)?$/,
    permission: 'access:admin',
  },
  { methods: '*', pattern: /\/admin\/space$/, permission: 'space:admin' },
];

/** El permiso que exige una ruta `/admin/*`, o null si no está listada (solo admins). */
export function permissionForAdminRoute(
  method: string,
  path: string,
): Permission | null {
  const verb = method.toUpperCase();
  const route = ADMIN_ROUTES.find(
    (item) =>
      item.pattern.test(path) &&
      (item.methods === '*' || item.methods.includes(verb)),
  );
  return route ? route.permission : null;
}

/** Si `reviewer` puede llamar a esa ruta `/admin/*`. Un admin, a todas. */
export function canUseAdminRoute(
  reviewer: Pick<Reviewer, 'isAdmin' | 'isAgent'>,
  method: string,
  path: string,
): boolean {
  if (reviewer.isAdmin) return true;
  const permission = permissionForAdminRoute(method, path);
  return permission !== null && can(reviewer, permission);
}
