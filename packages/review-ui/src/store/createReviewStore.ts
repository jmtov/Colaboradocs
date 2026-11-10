import type { NewComment, ReviewSnapshot } from '@juntanza/review-core';
import { createEffect, createSignal, onCleanup } from 'solid-js';
import {
  ApiRequestError,
  createReviewApi,
  loginRequest,
} from '../api/review.api';
import {
  createSessionStorage,
  type StoredSession,
} from '../session/session.utils';
import { createAccessStore } from './createAccessStore';
import { describeLoginError } from './review.messages';
import { DEFAULT_ROLE_FIELD, formatRole, type RoleField } from './role.utils';

/** Cada cuánto se vuelve a pedir el estado de la revisión mientras la pestaña está visible. */
const POLL_INTERVAL_MS = 30_000;

/** Cuánto dura un aviso en pantalla. */
const NOTICE_MS = 5_000;

export type LoginOutcome = { ok: true } | { ok: false; message: string };

export type ReviewStatus = 'idle' | 'loading' | 'ready' | 'error';

export function createReviewStore(
  documentId: string,
  storage: Storage | null,
  roleField: RoleField = DEFAULT_ROLE_FIELD,
) {
  const sessions = createSessionStorage(storage, `review:${documentId}`);
  const [session, setSession] = createSignal<StoredSession | null>(
    sessions.loadSession(),
  );
  const [snapshot, setSnapshot] = createSignal<ReviewSnapshot | null>(null);
  const [status, setStatus] = createSignal<ReviewStatus>('idle');
  const [notice, setNotice] = createSignal<string | null>(null);
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;

  function flash(message: string) {
    setNotice(message);
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => setNotice(null), NOTICE_MS);
  }

  function logout(message?: string) {
    sessions.clearSession();
    setSession(null);
    setSnapshot(null);
    setStatus('idle');
    if (message) flash(message);
  }

  const api = createReviewApi({
    documentId,
    getToken: () => session()?.token ?? null,
    onUnauthorized: () =>
      logout('Tu acceso ya no es válido. Ingresa tu PIN de nuevo.'),
  });

  const access = createAccessStore(api);

  async function refresh() {
    if (!session()) return;
    try {
      setSnapshot(await api.fetchReview());
      setStatus('ready');
    } catch (error) {
      const unauthorized =
        error instanceof ApiRequestError && error.status === 401;
      if (!unauthorized && status() !== 'ready') setStatus('error');
    }
  }

  /** Corre una acción; si falla, avisa y recarga el estado real del servidor. */
  async function run(action: () => Promise<unknown>, failure: string) {
    try {
      await action();
      return true;
    } catch (error) {
      const unauthorized =
        error instanceof ApiRequestError && error.status === 401;
      if (!unauthorized) flash(failure);
      await refresh();
      return false;
    }
  }

  async function login(pin: string): Promise<LoginOutcome> {
    try {
      const response = await loginRequest(pin, sessions.deviceId());
      const stored = { token: response.token, reviewer: response.reviewer };
      sessions.saveSession(stored);
      setSession(stored);
      setNotice(null);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: describeLoginError(error) };
    }
  }

  async function addComment(comment: NewComment) {
    const saved = await run(
      () => api.postComment(comment),
      'No se pudo guardar el comentario.',
    );
    if (saved) await refresh();
    return saved;
  }

  async function deleteComment(commentId: string) {
    const done = await run(
      () => api.deleteComment(commentId),
      'No se pudo eliminar el comentario.',
    );
    if (done) await refresh();
  }

  async function setResolved(commentId: string, resolved: boolean) {
    const done = await run(
      () => api.setResolved(commentId, resolved),
      'No se pudo actualizar el hilo.',
    );
    if (done) await refresh();
  }

  /** Marca o quita el OK propio; se ve al instante y se corrige si el servidor falla. */
  async function toggleApproval(blockId: string) {
    const current = snapshot();
    if (!current) return;
    const mine = current.me.id;
    const approved = current.approvals.some(
      (approval) =>
        approval.blockId === blockId && approval.reviewerId === mine,
    );
    const approvals = approved
      ? current.approvals.filter(
          (approval) =>
            !(approval.blockId === blockId && approval.reviewerId === mine),
        )
      : [...current.approvals, { blockId, reviewerId: mine }];
    setSnapshot({
      ...current,
      approvals,
      reviewers: {
        ...current.reviewers,
        [mine]: {
          name: current.me.name,
          municipality: current.me.municipality,
        },
      },
    });
    await run(
      () => (approved ? api.deleteApproval(blockId) : api.putApproval(blockId)),
      'No se pudo guardar tu OK.',
    );
  }

  /** Carga al abrir sesión y sondea mientras la pestaña esté visible. Llamar dentro de un componente. */
  function start() {
    createEffect(() => {
      if (!session()) return;
      setStatus('loading');
      void refresh();
      const timer = setInterval(() => {
        if (document.visibilityState === 'visible') void refresh();
      }, POLL_INTERVAL_MS);
      const onVisible = () => {
        if (document.visibilityState === 'visible') void refresh();
      };
      document.addEventListener('visibilitychange', onVisible);
      onCleanup(() => {
        clearInterval(timer);
        document.removeEventListener('visibilitychange', onVisible);
      });
    });
    onCleanup(() => clearTimeout(noticeTimer));
  }

  return {
    session,
    snapshot,
    status,
    notice,
    start,
    login,
    logout: () => logout(),
    refresh,
    addComment,
    deleteComment,
    setResolved,
    toggleApproval,
    flash,
    access,
    role: {
      label: roleField.label,
      format: (value: string) => formatRole(roleField, value),
    },
  };
}

export type ReviewStore = ReturnType<typeof createReviewStore>;
