import type { AccessNode, ManagedReviewer } from '@juntanza/review-core';

type Row = {
  id: string;
  name: string;
  municipality: string | null;
  is_admin: number;
  max_devices: number;
  promoted_by: string | null;
  revoked_at: string | null;
  devices: number;
};

const SELECT = `
  SELECT r.id, r.name, r.municipality, r.is_admin, r.max_devices, r.promoted_by, r.revoked_at,
         (SELECT COUNT(*) FROM devices d WHERE d.reviewer_id = r.id) AS devices
  FROM reviewers r`;

export type StoredReviewer = {
  id: string;
  name: string;
  municipality: string | null;
  isAdmin: boolean;
  maxDevices: number;
  promotedBy: string | null;
  revoked: boolean;
  devices: number;
};

function toStored(row: Row): StoredReviewer {
  return {
    id: row.id,
    name: row.name,
    municipality: row.municipality,
    isAdmin: row.is_admin === 1,
    maxDevices: row.max_devices,
    promotedBy: row.promoted_by,
    revoked: row.revoked_at !== null,
    devices: row.devices,
  };
}

/** Todas las personas, incluidas las revocadas (hacen falta para la cadena y para reactivar). */
export async function listStoredReviewers(
  db: D1Database,
): Promise<StoredReviewer[]> {
  const { results } = await db
    .prepare(`${SELECT} ORDER BY r.created_at, r.name`)
    .all<Row>();
  return results.map(toStored);
}

export async function findStoredReviewer(
  db: D1Database,
  id: string,
): Promise<StoredReviewer | null> {
  const row = await db
    .prepare(`${SELECT} WHERE r.id = ?`)
    .bind(id)
    .first<Row>();
  return row ? toStored(row) : null;
}

export async function findStoredReviewerByName(
  db: D1Database,
  name: string,
): Promise<StoredReviewer | null> {
  const row = await db
    .prepare(`${SELECT} WHERE r.name = ?`)
    .bind(name)
    .first<Row>();
  return row ? toStored(row) : null;
}

export function toAccessNodes(people: StoredReviewer[]): AccessNode[] {
  return people
    .filter((person) => !person.revoked)
    .map((person) => ({
      id: person.id,
      isAdmin: person.isAdmin,
      promotedBy: person.promotedBy,
    }));
}

export function toManaged(
  person: StoredReviewer,
  locked: boolean,
): ManagedReviewer {
  return {
    id: person.id,
    name: person.name,
    municipality: person.municipality,
    isAdmin: person.isAdmin,
    devices: person.devices,
    maxDevices: person.maxDevices,
    locked,
  };
}

export async function insertReviewer(
  db: D1Database,
  person: {
    id: string;
    name: string;
    pinHash: string;
    municipality: string;
    isAdmin: boolean;
    promotedBy: string | null;
    now: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO reviewers (id, name, pin_hash, is_admin, max_devices, municipality, promoted_by, created_at)
       VALUES (?, ?, ?, ?, 2, ?, ?, ?)`,
    )
    .bind(
      person.id,
      person.name,
      person.pinHash,
      person.isAdmin ? 1 : 0,
      person.municipality,
      person.promotedBy,
      person.now,
    )
    .run();
}

/** Vuelve a dar acceso a alguien eliminado antes: PIN nuevo, sin dispositivos, con los datos nuevos. */
export async function reactivateReviewer(
  db: D1Database,
  person: {
    id: string;
    pinHash: string;
    municipality: string;
    isAdmin: boolean;
    promotedBy: string | null;
  },
): Promise<void> {
  await db.batch([
    db
      .prepare(
        `UPDATE reviewers SET pin_hash = ?, municipality = ?, is_admin = ?, promoted_by = ?, revoked_at = NULL
         WHERE id = ?`,
      )
      .bind(
        person.pinHash,
        person.municipality,
        person.isAdmin ? 1 : 0,
        person.promotedBy,
        person.id,
      ),
    db.prepare('DELETE FROM devices WHERE reviewer_id = ?').bind(person.id),
  ]);
}

export async function updateMunicipality(
  db: D1Database,
  id: string,
  municipality: string,
): Promise<void> {
  await db
    .prepare('UPDATE reviewers SET municipality = ? WHERE id = ?')
    .bind(municipality, id)
    .run();
}

function reparentChildren(db: D1Database, id: string) {
  return db
    .prepare(
      'UPDATE reviewers SET promoted_by = (SELECT promoted_by FROM reviewers WHERE id = ?1) WHERE promoted_by = ?1',
    )
    .bind(id);
}

/** Cambia el nivel de acceso. Al quitar el admin se borra quién la hizo; al darlo, se anota. */
export async function updateAdmin(
  db: D1Database,
  id: string,
  isAdmin: boolean,
  promotedBy: string | null,
): Promise<void> {
  await db.batch([
    // Quienes ella hizo admin pasan a depender de quien la hizo a ella: la cadena no se rompe.
    ...(isAdmin ? [] : [reparentChildren(db, id)]),
    db
      .prepare(
        'UPDATE reviewers SET is_admin = ?, promoted_by = ? WHERE id = ?',
      )
      .bind(isAdmin ? 1 : 0, isAdmin ? promotedBy : null, id),
  ]);
}

/** PIN nuevo: el anterior deja de servir y se sueltan los dispositivos. */
export async function replacePin(
  db: D1Database,
  id: string,
  pinHash: string,
): Promise<void> {
  await db.batch([
    db
      .prepare('UPDATE reviewers SET pin_hash = ? WHERE id = ?')
      .bind(pinHash, id),
    db.prepare('DELETE FROM devices WHERE reviewer_id = ?').bind(id),
  ]);
}

export async function resetDevices(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM devices WHERE reviewer_id = ?').bind(id).run();
}

/** «Eliminar»: se revoca y se sueltan los dispositivos; sus comentarios se conservan. */
export async function revokeReviewer(
  db: D1Database,
  id: string,
  now: string,
): Promise<void> {
  await db.batch([
    reparentChildren(db, id),
    db
      .prepare(
        'UPDATE reviewers SET revoked_at = ?, is_admin = 0, promoted_by = NULL WHERE id = ?',
      )
      .bind(now, id),
    db.prepare('DELETE FROM devices WHERE reviewer_id = ?').bind(id),
  ]);
}
