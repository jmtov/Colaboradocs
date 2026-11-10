import {
  DEFAULT_MAX_DEVICES,
  type Reviewer,
  type ReviewerLabel,
} from '@juntanza/review-core';

type ReviewerRow = {
  id: string;
  name: string;
  is_admin: number;
  municipality: string | null;
};

type PinRow = ReviewerRow & {
  max_devices: number;
  revoked_at: string | null;
};

function toReviewer(row: ReviewerRow): Reviewer {
  return {
    id: row.id,
    name: row.name,
    isAdmin: row.is_admin === 1,
    municipality: row.municipality,
  };
}

export type PinMatch = {
  reviewer: Reviewer;
  maxDevices: number;
};

/** El revisor dueño de ese hash de PIN, si existe y no está revocado. */
export async function findReviewerByPinHash(
  db: D1Database,
  pinHash: string,
): Promise<PinMatch | null> {
  const row = await db
    .prepare(
      'SELECT id, name, is_admin, municipality, max_devices, revoked_at FROM reviewers WHERE pin_hash = ?',
    )
    .bind(pinHash)
    .first<PinRow>();
  if (!row || row.revoked_at !== null) return null;
  return {
    reviewer: toReviewer(row),
    maxDevices: row.max_devices || DEFAULT_MAX_DEVICES,
  };
}

/** El revisor del token, solo si sigue activo y el dispositivo está registrado. */
export async function findReviewerForDevice(
  db: D1Database,
  reviewerId: string,
  deviceId: string,
): Promise<Reviewer | null> {
  const row = await db
    .prepare(
      `SELECT r.id, r.name, r.is_admin, r.municipality
       FROM reviewers r
       JOIN devices d ON d.reviewer_id = r.id
       WHERE r.id = ? AND d.device_id = ? AND r.revoked_at IS NULL`,
    )
    .bind(reviewerId, deviceId)
    .first<ReviewerRow>();
  return row ? toReviewer(row) : null;
}

export async function isDeviceRegistered(
  db: D1Database,
  reviewerId: string,
  deviceId: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      'SELECT 1 AS found FROM devices WHERE reviewer_id = ? AND device_id = ?',
    )
    .bind(reviewerId, deviceId)
    .first();
  return row !== null;
}

export async function countDevices(
  db: D1Database,
  reviewerId: string,
): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) AS total FROM devices WHERE reviewer_id = ?')
    .bind(reviewerId)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export async function registerDevice(
  db: D1Database,
  reviewerId: string,
  deviceId: string,
  now: string,
): Promise<void> {
  await db
    .prepare(
      'INSERT OR IGNORE INTO devices (reviewer_id, device_id, first_seen_at) VALUES (?, ?, ?)',
    )
    .bind(reviewerId, deviceId, now)
    .run();
}

export async function countRecentLoginFailures(
  db: D1Database,
  ip: string,
  since: string,
): Promise<number> {
  const row = await db
    .prepare(
      'SELECT COUNT(*) AS total FROM login_failures WHERE ip = ? AND failed_at > ?',
    )
    .bind(ip, since)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export async function recordLoginFailure(
  db: D1Database,
  ip: string,
  now: string,
  deleteBefore: string,
): Promise<void> {
  await db.batch([
    db
      .prepare('DELETE FROM login_failures WHERE failed_at < ?')
      .bind(deleteBefore),
    db
      .prepare('INSERT INTO login_failures (ip, failed_at) VALUES (?, ?)')
      .bind(ip, now),
  ]);
}

/** Nombre y municipio de cada revisor, por id: para mostrar quién comentó o dio OK. */
export async function listReviewerLabels(
  db: D1Database,
): Promise<Record<string, ReviewerLabel>> {
  const { results } = await db
    .prepare('SELECT id, name, municipality FROM reviewers')
    .all<{ id: string; name: string; municipality: string | null }>();
  return Object.fromEntries(
    results.map((row) => [
      row.id,
      { name: row.name, municipality: row.municipality },
    ]),
  );
}
