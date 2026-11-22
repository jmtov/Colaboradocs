import type { DeckBundle, DeckListItem } from '@colaboradocs/deck-core';
import type {
  ApiError,
  ApiErrorCode,
  DocumentContent,
  DocumentDraft,
  DocumentListItem,
  DocumentVersionItem,
  DraftInfo,
  DraftPublish,
  IssuedPin,
  LoginResponse,
  ManagedReviewer,
  NewComment,
  NewReviewer,
  NewTask,
  ReviewComment,
  ReviewerPatch,
  ReviewSnapshot,
  SpaceInfo,
  Task,
  TaskPatch,
  TaskPerson,
} from '@colaboradocs/review-core';

export class ApiRequestError extends Error {
  readonly code: ApiErrorCode | 'network';
  readonly status: number;
  /** Qué estaba mal, cuando el servidor lo explica (p. ej. un documento inválido). */
  readonly details: string[];

  constructor(
    code: ApiErrorCode | 'network',
    status: number,
    details: string[] = [],
  ) {
    super(code);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type ApiOptions = {
  /** Documento abierto ahora; null en la home (no hay documento). */
  documentId: () => string | null;
  getToken: () => string | null;
  /** Se llama cuando el servidor responde 401 a una petición con token. */
  onUnauthorized: () => void;
};

const BASE = '/api';

async function readError(response: Response): Promise<ApiRequestError> {
  try {
    const body = (await response.json()) as Partial<ApiError>;
    return new ApiRequestError(
      body.error ?? 'invalid_request',
      response.status,
      body.details ?? [],
    );
  } catch {
    return new ApiRequestError('invalid_request', response.status);
  }
}

async function send(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${BASE}${path}`, init);
  } catch {
    throw new ApiRequestError('network', 0);
  }
}

/** Nombre y rol del espacio. Público: se pide antes de ingresar. */
export async function fetchSpace(): Promise<SpaceInfo> {
  const response = await send('/space', {});
  if (!response.ok) throw await readError(response);
  return (await response.json()) as SpaceInfo;
}

export async function loginRequest(
  pin: string,
  deviceId: string,
): Promise<LoginResponse> {
  const response = await send('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin, deviceId }),
  });
  if (!response.ok) throw await readError(response);
  return (await response.json()) as LoginResponse;
}

export function createReviewApi(options: ApiOptions) {
  function documentPath() {
    const id = options.documentId();
    if (!id) throw new ApiRequestError('invalid_request', 0);
    return `/documents/${id}`;
  }

  async function request(path: string, init: RequestInit = {}, base?: string) {
    const token = options.getToken();
    const response = await send(`${base ?? documentPath()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (response.status === 401) options.onUnauthorized();
    if (!response.ok) throw await readError(response);
    return response;
  }

  return {
    async fetchReview(): Promise<ReviewSnapshot> {
      const response = await request('/review');
      return (await response.json()) as ReviewSnapshot;
    },
    async fetchDocuments(): Promise<DocumentListItem[]> {
      const response = await request('', {}, '/documents');
      return (await response.json()) as DocumentListItem[];
    },
    async fetchContent(id: string): Promise<DocumentContent> {
      const response = await request(`/${id}/content`, {}, '/documents');
      return (await response.json()) as DocumentContent;
    },
    async fetchDecks(): Promise<DeckListItem[]> {
      const response = await request('', {}, '/decks');
      return (await response.json()) as DeckListItem[];
    },
    async fetchDeck(id: string): Promise<DeckBundle> {
      const response = await request(`/${id}`, {}, '/decks');
      return (await response.json()) as DeckBundle;
    },
    /** Un archivo de un tema (`/themes/<id>/files/<file>`) o de un deck (`/decks/<id>/files/<ruta>`). */
    async fetchFile(path: string): Promise<Blob> {
      const response = await request('', {}, path);
      return await response.blob();
    },
    async fetchVersions(id: string): Promise<DocumentVersionItem[]> {
      const response = await request(`/${id}/versions`, {}, '/documents');
      return (await response.json()) as DocumentVersionItem[];
    },
    async putDocument(
      document: DocumentContent,
    ): Promise<{ created: boolean }> {
      const response = await request(
        `/documents/${document.id}`,
        { method: 'PUT', body: JSON.stringify(document) },
        '/admin',
      );
      return (await response.json()) as { created: boolean };
    },
    /** El borrador del documento, o null si no hay (admins). */
    async fetchDraft(id: string): Promise<DocumentDraft | null> {
      try {
        const response = await request(`/documents/${id}/draft`, {}, '/admin');
        return (await response.json()) as DocumentDraft;
      } catch (error) {
        if (error instanceof ApiRequestError && error.code === 'not_found') {
          return null;
        }
        throw error;
      }
    },
    async saveDraft(
      content: DocumentContent,
      expectedRevision: number,
    ): Promise<DraftInfo> {
      const response = await request(
        `/documents/${content.id}/draft`,
        { method: 'PUT', body: JSON.stringify({ content, expectedRevision }) },
        '/admin',
      );
      return (await response.json()) as DraftInfo;
    },
    async discardDraft(id: string): Promise<void> {
      await request(`/documents/${id}/draft`, { method: 'DELETE' }, '/admin');
    },
    async publishDraft(
      id: string,
      options: DraftPublish,
    ): Promise<{ created: boolean }> {
      const response = await request(
        `/documents/${id}/publish`,
        { method: 'POST', body: JSON.stringify(options) },
        '/admin',
      );
      return (await response.json()) as { created: boolean };
    },
    async archiveDocument(id: string): Promise<void> {
      await request(`/documents/${id}`, { method: 'DELETE' }, '/admin');
    },
    async putSpace(space: SpaceInfo): Promise<SpaceInfo> {
      const response = await request(
        '/space',
        { method: 'PUT', body: JSON.stringify(space) },
        '/admin',
      );
      return (await response.json()) as SpaceInfo;
    },
    async postComment(comment: NewComment): Promise<ReviewComment> {
      const response = await request('/comments', {
        method: 'POST',
        body: JSON.stringify(comment),
      });
      return (await response.json()) as ReviewComment;
    },
    async deleteComment(commentId: string): Promise<void> {
      await request(`/comments/${commentId}`, { method: 'DELETE' });
    },
    async setResolved(commentId: string, resolved: boolean): Promise<void> {
      await request(`/comments/${commentId}/resolved`, {
        method: 'PUT',
        body: JSON.stringify({ resolved }),
      });
    },
    async putApproval(blockId: string): Promise<void> {
      await request(`/approvals/${blockId}`, { method: 'PUT' });
    },
    async deleteApproval(blockId: string): Promise<void> {
      await request(`/approvals/${blockId}`, { method: 'DELETE' });
    },

    // Tareas: no cuelgan del documento abierto.
    async fetchMyTasks(): Promise<Task[]> {
      const response = await request('', {}, '/tasks');
      return (await response.json()) as Task[];
    },
    async fetchDocumentTasks(documentId: string): Promise<Task[]> {
      const response = await request(
        `?document=${encodeURIComponent(documentId)}`,
        {},
        '/tasks',
      );
      return (await response.json()) as Task[];
    },
    async fetchTaskPeople(): Promise<TaskPerson[]> {
      const response = await request('/people', {}, '/tasks');
      return (await response.json()) as TaskPerson[];
    },
    async postTask(task: NewTask): Promise<Task> {
      const response = await request(
        '',
        { method: 'POST', body: JSON.stringify(task) },
        '/tasks',
      );
      return (await response.json()) as Task;
    },
    async patchTask(id: string, patch: TaskPatch): Promise<Task> {
      const response = await request(
        `/${id}`,
        { method: 'PATCH', body: JSON.stringify(patch) },
        '/tasks',
      );
      return (await response.json()) as Task;
    },
    async deleteTask(id: string): Promise<void> {
      await request(`/${id}`, { method: 'DELETE' }, '/tasks');
    },

    // Accesos (solo admins): no cuelgan de un documento.
    async listPeople(): Promise<ManagedReviewer[]> {
      const response = await request('/reviewers', {}, '/admin');
      return (await response.json()) as ManagedReviewer[];
    },
    async addPerson(person: NewReviewer): Promise<IssuedPin> {
      const response = await request(
        '/reviewers',
        { method: 'POST', body: JSON.stringify(person) },
        '/admin',
      );
      return (await response.json()) as IssuedPin;
    },
    async patchPerson(id: string, patch: ReviewerPatch): Promise<void> {
      await request(
        `/reviewers/${id}`,
        { method: 'PATCH', body: JSON.stringify(patch) },
        '/admin',
      );
    },
    async removePerson(id: string): Promise<void> {
      await request(`/reviewers/${id}`, { method: 'DELETE' }, '/admin');
    },
    async regeneratePin(id: string): Promise<IssuedPin> {
      const response = await request(
        `/reviewers/${id}/pin`,
        { method: 'POST' },
        '/admin',
      );
      return (await response.json()) as IssuedPin;
    },
    async resetDevices(id: string): Promise<void> {
      await request(
        `/reviewers/${id}/devices/reset`,
        { method: 'POST' },
        '/admin',
      );
    },
  };
}

export type ReviewApi = ReturnType<typeof createReviewApi>;
