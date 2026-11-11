import {
  hashPin,
  isValidPin,
  type LoginResponse,
  normalizePin,
} from '@juntanza/review-core';
import { Hono } from 'hono';
import {
  DEVICE_ID_PATTERN,
  LOGIN_FAILURE_RETENTION_MS,
  LOGIN_FAILURE_WINDOW_MS,
  MAX_LOGIN_FAILURES,
  TOKEN_TTL_MS,
} from '@/auth/auth.constants';
import { signToken } from '@/auth/token.utils';
import {
  countDevices,
  countRecentLoginFailures,
  findReviewerByPinHash,
  isDeviceRegistered,
  recordLoginFailure,
  registerDevice,
} from '@/db/reviewers.queries';
import type { AppEnv } from '@/env.types';
import { errorResponse, readJsonObject } from '@/http.utils';

export const loginRoute = new Hono<AppEnv>().post('/login', async (c) => {
  const body = await readJsonObject(c);
  const pinInput = body?.pin;
  const deviceId = body?.deviceId;
  if (
    typeof pinInput !== 'string' ||
    typeof deviceId !== 'string' ||
    !DEVICE_ID_PATTERN.test(deviceId)
  ) {
    return errorResponse(c, 'invalid_request');
  }

  const db = c.env.DB;
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const since = new Date(now - LOGIN_FAILURE_WINDOW_MS).toISOString();
  if ((await countRecentLoginFailures(db, ip, since)) >= MAX_LOGIN_FAILURES) {
    return errorResponse(c, 'too_many_attempts');
  }

  const fail = async () => {
    const deleteBefore = new Date(
      now - LOGIN_FAILURE_RETENTION_MS,
    ).toISOString();
    await recordLoginFailure(db, ip, nowIso, deleteBefore);
    return errorResponse(c, 'invalid_pin');
  };

  const pin = normalizePin(pinInput);
  if (!isValidPin(pin)) return fail();
  const match = await findReviewerByPinHash(
    db,
    await hashPin(pin, c.env.TOKEN_SECRET),
  );
  if (!match) return fail();

  const { reviewer, maxDevices } = match;
  const known = await isDeviceRegistered(db, reviewer.id, deviceId);
  if (!known) {
    if ((await countDevices(db, reviewer.id)) >= maxDevices) {
      return errorResponse(c, 'device_limit');
    }
    await registerDevice(db, reviewer.id, deviceId, nowIso);
  }

  const token = await signToken(
    { reviewerId: reviewer.id, deviceId, expiresAt: now + TOKEN_TTL_MS },
    c.env.TOKEN_SECRET,
  );
  const response: LoginResponse = { token, reviewer };
  return c.json(response);
});
