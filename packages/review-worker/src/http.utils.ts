import type { ApiError, ApiErrorCode } from '@juntanza/review-core';
import type { Context } from 'hono';

const STATUS_BY_CODE: Record<ApiErrorCode, 400 | 401 | 403 | 404 | 409 | 429> =
  {
    invalid_pin: 401,
    device_limit: 403,
    too_many_attempts: 429,
    unauthorized: 401,
    forbidden: 403,
    not_found: 404,
    name_taken: 409,
    invalid_request: 400,
  };

export function errorResponse(
  c: Context,
  code: ApiErrorCode,
  details?: string[],
) {
  const body: ApiError = details ? { error: code, details } : { error: code };
  return c.json(body, STATUS_BY_CODE[code]);
}

/** Cuerpo JSON como objeto, o null si no es JSON o no es un objeto. */
export async function readJsonObject(
  c: Context,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await c.req.json();
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return null;
    }
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}
