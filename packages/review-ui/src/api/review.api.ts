import type {
  ApiError,
  ApiErrorCode,
  DocumentContent,
  DocumentListItem,
  DocumentVersionItem,
  IssuedPin,
  LoginResponse,
  ManagedReviewer,
  NewComment,
  NewReviewer,
  ReviewComment,
  ReviewerPatch,
  ReviewSnapshot,
  SpaceInfo,
} from '@juntanza/review-core';

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
