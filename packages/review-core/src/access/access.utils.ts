export type AccessNode = {
  id: string;
  isAdmin: boolean;
  /** Quién la hizo admin; null si la creó el CLI o nunca fue admin. */
  promotedBy: string | null;
};

/**
 * Ids sobre los que `callerId` no puede actuar (quitar acceso, cambiar nivel,
 * regenerar PIN, restablecer dispositivos): ella misma, quien la hizo admin y
 * toda esa cadena hacia arriba, y los admins creados por CLI (la raíz), que
 * solo se gestionan por CLI. Así siempre queda al menos un admin con acceso.
 */
export function lockedReviewerIds(
  people: AccessNode[],
  callerId: string,
): Set<string> {
  const byId = new Map(people.map((person) => [person.id, person]));
  const locked = new Set<string>([callerId]);
  let current = byId.get(callerId)?.promotedBy ?? null;
  while (current !== null && !locked.has(current)) {
    locked.add(current);
    current = byId.get(current)?.promotedBy ?? null;
  }
  for (const person of people) {
    if (person.isAdmin && person.promotedBy === null) locked.add(person.id);
  }
  return locked;
}
