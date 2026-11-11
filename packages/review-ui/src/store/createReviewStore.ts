import type {
  DocumentContent,
  DocumentListItem,
  DraftPublish,
  NewComment,
  ReviewSnapshot,
  SpaceInfo,
} from '@colaboradocs/review-core';
import { createEffect, createSignal, onCleanup, untrack } from 'solid-js';
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
import {
  describeDraftError,
  describeLoginError,
  describePublishError,
} from './review.messages';
import { DEFAULT_ROLE_FIELD, formatRole, type RoleField } from './role.utils';

/** Cada cuánto se vuelve a pedir el estado de la revisión mientras la pestaña está visible. */
const POLL_INTERVAL_MS = 30_000;

/** Cuánto dura un aviso en pantalla. */
const NOTICE_MS = 5_000;

export type LoginOutcome = { ok: true } | { ok: false; message: string };

export type ReviewStatus = 'idle' | 'loading' | 'ready' | 'error';

export type ReviewStoreOptions = {
  /** Documento abierto ahora (reactivo); null en la home, donde no hay uno. */
  documentId: () => string | null;
  storage: Storage | null;
  /** Rol de las personas (lo define el espacio); reactivo porque llega después de cargar. */
  roleField?: () => RoleField | undefined;
  /** Prefijos de sesiones guardadas por documento, a adoptar (ver `createSessionStorage`). */
  legacyPrefixes?: string[];
};

export function createReviewStore(options: ReviewStoreOptions) {
  const { documentId, storage, legacyPrefixes } = options;
  const roleField = () => options.roleField?.() ?? DEFAULT_ROLE_FIELD;
  const sessions = createSessionStorage(storage, 'review', legacyPrefixes);
  const [session, setSession] = createSignal<StoredSession | null>(
    sessions.loadSession(),
  );
  const [snapshot, setSnapshot] = createSignal<ReviewSnapshot | null>(null);
  const [documents, setDocuments] = createSignal<DocumentListItem[] | null>(
    null,
  );
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
    const requested = documentId();
    try {
      if (requested === null) {
        const fetched = await api.fetchDocuments();
        if (documentId() !== requested) return;
        setDocuments(fetched);
      } else {
        const fetched = await api.fetchReview();
        // Si mientras tanto se abrió otro documento, esta respuesta ya no sirve.
        if (documentId() !== requested) return;
        setSnapshot(fetched);
      }
      setStatus('ready');
    } catch (error) {
      const unauthorized =
        error instanceof ApiRequestError && error.status === 401;
      if (!unauthorized && status() !== 'ready') setStatus('error');
    }
  }

  /** Carga la lista de documentos sin tocar el estado de la pantalla. */
  async function loadDocuments() {
    try {
      setDocuments(await api.fetchDocuments());
    } catch {
      // Si falla, la home la vuelve a pedir; aquí no es crítico.
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
      : [
          ...current.approvals,
          { blockId, reviewerId: mine, createdAt: new Date().toISOString() },
        ];
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

  type PublishOutcome =
    | { ok: true; created?: boolean }
    | { ok: false; message: string; details: string[] };

  /** Sube o reemplaza un documento (admins). Al terminar, recarga la lista. */
  async function publishDocument(
    document: DocumentContent,
  ): Promise<PublishOutcome> {
    try {
      const saved = await api.putDocument(document);
      setDocuments(await api.fetchDocuments());
      return { ok: true, created: saved.created };
    } catch (error) {
      return { ok: false, ...describePublishError(error) };
    }
  }

  type DraftOutcome<T> =
    | { ok: true; value: T }
    | {
        ok: false;
        code: ApiRequestError['code'];
        message: string;
        details: string[];
      };

  async function draftCall<T>(run: () => Promise<T>): Promise<DraftOutcome<T>> {
    try {
      return { ok: true, value: await run() };
    } catch (error) {
      return { ok: false, ...describeDraftError(error) };
    }
  }

  /** Publica el borrador (admins) y recarga la lista de documentos. */
  async function publishDraft(
    id: string,
    options: DraftPublish,
  ): Promise<DraftOutcome<{ created: boolean }>> {
    const outcome = await draftCall(() => api.publishDraft(id, options));
    if (outcome.ok) setDocuments(await api.fetchDocuments());
    return outcome;
  }

  /** Oculta un documento (admins); sus comentarios se conservan. */
  async function archiveDocument(id: string): Promise<PublishOutcome> {
    try {
      await api.archiveDocument(id);
      setDocuments(await api.fetchDocuments());
      return { ok: true };
    } catch (error) {
      return { ok: false, ...describePublishError(error) };
    }
  }

  async function saveSpace(space: SpaceInfo): Promise<PublishOutcome> {
    try {
      await api.putSpace(space);
      return { ok: true };
    } catch (error) {
      return { ok: false, ...describePublishError(error) };
    }
  }

  /** Carga al abrir sesión y sondea mientras la pestaña esté visible. Llamar dentro de un componente. */
  function start() {
    createEffect(() => {
      if (!session()) return;
      // Cambiar de documento (o volver a la home) descarta lo del anterior.
      documentId();
      setSnapshot(null);
      setStatus('loading');
      void refresh();
      // Dentro de un documento también hace falta la lista (p. ej. el enlace de regreso).
      // `untrack`: solo se mira si falta la lista; si este efecto la siguiera, cada vez
      // que la lista cambia reiniciaría la revisión (y la lista se volvería a pedir).
      if (documentId() !== null && untrack(() => documents() === null)) {
        void loadDocuments();
      }
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
    documents,
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
      get label() {
        return roleField().label;
      },
      format: (value: string) => formatRole(roleField(), value),
    },
    /** El contenido de un documento (lanza si no existe o no hay sesión). */
    fetchContent: (id: string) => api.fetchContent(id),
    /** Versiones del documento: la actual y las que se reemplazaron. */
    fetchVersions: (id: string) => api.fetchVersions(id),
    loadDocuments,
    publishDocument,
    archiveDocument,
    /** Borrador del documento (admins): null si no hay. */
    fetchDraft: (id: string) => draftCall(() => api.fetchDraft(id)),
    saveDraft: (content: DocumentContent, expectedRevision: number) =>
      draftCall(() => api.saveDraft(content, expectedRevision)),
    discardDraft: (id: string) => draftCall(() => api.discardDraft(id)),
    publishDraft,
    saveSpace,
  };
}

export type ReviewStore = ReturnType<typeof createReviewStore>;
