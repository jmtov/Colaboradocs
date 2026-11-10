import type { ReviewComment } from './review.types';

export type Thread = {
  root: ReviewComment;
  /** Todas las respuestas del hilo, en orden cronológico (una sola capa). */
  replies: ReviewComment[];
};

function byDate(a: ReviewComment, b: ReviewComment): number {
  return a.createdAt.localeCompare(b.createdAt);
}

/**
 * Agrupa los comentarios en hilos por bloque. Una respuesta a otra respuesta
 * cuelga de la raíz del hilo. Las respuestas cuyo padre no existe se descartan.
 */
export function groupThreads(comments: ReviewComment[]): Map<string, Thread[]> {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const rootOf = (comment: ReviewComment): ReviewComment | null => {
    let current = comment;
    const visited = new Set<string>();
    while (current.parentId !== null) {
      if (visited.has(current.id)) return null;
      visited.add(current.id);
      const parent = byId.get(current.parentId);
      if (!parent) return null;
      current = parent;
    }
    return current;
  };

  const threads = new Map<string, Thread>();
  for (const comment of [...comments].sort(byDate)) {
    if (comment.parentId === null) {
      threads.set(comment.id, { root: comment, replies: [] });
      continue;
    }
    const root = rootOf(comment);
    const thread = root ? threads.get(root.id) : undefined;
    if (thread) thread.replies.push(comment);
  }

  const byBlock = new Map<string, Thread[]>();
  for (const thread of threads.values()) {
    const list = byBlock.get(thread.root.blockId) ?? [];
    list.push(thread);
    byBlock.set(thread.root.blockId, list);
  }
  return byBlock;
}

/** Hilos sin resolver de un bloque: lo que todavía pide atención. */
export function openThreadCount(threads: Thread[]): number {
  return threads.filter((thread) => !thread.root.resolved).length;
}
