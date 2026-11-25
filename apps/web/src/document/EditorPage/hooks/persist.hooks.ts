import type { DocumentContent } from '@colaboradocs/review-core';
import { useOverlay, useReview } from '@colaboradocs/review-ui';
import { createSignal } from 'solid-js';
import { documentPath, navigate } from '@/shared/router/router';
import { affectedBlocks } from '../affected.utils';
import PublishSheet from '../components/PublishSheet/PublishSheet';
import { nextVersion } from '../version.utils';
import type { Confirm } from './confirm.hooks';
import type { EditorDraft } from './draft.hooks';

const today = () => new Date().toISOString().slice(0, 10);

type Deps = { id: () => string; draft: EditorDraft; confirm: Confirm };

/** Guardar el borrador, descartarlo, publicarlo y salir. Los cambios no se pierden aunque se escriba mientras se guarda. */
export function usePersist({ id, draft, confirm }: Deps) {
  const review = useReview();
  const overlay = useOverlay();
  const [saving, setSaving] = createSignal(false);
  const [busy, setBusy] = createSignal(false);

  /** Guarda `next` (por defecto, lo que hay) como borrador. Devuelve si quedó guardado. */
  async function save(next?: DocumentContent): Promise<boolean> {
    const toSave = next ?? draft.content();
    if (!toSave || saving()) return false;
    setSaving(true);
    draft.setProblem(null);
    const result = await review.saveDraft(toSave, draft.revision());
    setSaving(false);
    if (!result.ok) {
      draft.setProblem(result);
      return false;
    }
    draft.setRevision(result.value.revision);
    draft.setStale(result.value.stale);
    // La copia de trabajo no se toca: lo escrito mientras se guardaba sigue pendiente.
    draft.setBase(toSave);
    return true;
  }

  /** Vuelve al documento; con cambios sin guardar, pregunta. */
  async function leave() {
    if (
      draft.dirty() &&
      !(await confirm(
        'Salir sin guardar',
        'Tienes cambios sin guardar. Si sales, se pierden.',
        'Salir',
        true,
      ))
    ) {
      return;
    }
    navigate(documentPath(id()));
  }

  async function discard() {
    if (!draft.hasDraft() && !draft.dirty()) {
      navigate(documentPath(id()));
      return;
    }
    const ok = await confirm(
      'Descartar el borrador',
      'Se borran los cambios del borrador y se vuelve a lo publicado. No se puede deshacer.',
      'Descartar',
      true,
    );
    if (!ok) return;
    setBusy(true);
    if (draft.hasDraft()) {
      const result = await review.discardDraft(id());
      if (!result.ok && result.code !== 'not_found') {
        setBusy(false);
        draft.setProblem(result);
        return;
      }
    }
    setBusy(false);
    review.flash('Borrador descartado.');
    navigate(documentPath(id()));
  }

  async function publish() {
    const current = draft.content();
    if (!current || busy()) return;
    const comments = review.snapshot()?.comments ?? [];
    const approvals = review.snapshot()?.approvals ?? [];
    const before = draft.published();
    const affected = before
      ? affectedBlocks(before, current, comments, approvals)
      : [];
    // Se propone la que sigue a la publicada; la hoja no deja una igual o anterior.
    const version = await overlay.sheet(PublishSheet, {
      published: before?.version ?? null,
      version: before ? nextVersion(before.version) : current.version,
      affected,
    });
    if (version === undefined) return;

    setBusy(true);
    const toPublish = { ...current, version, updated: today() };
    const wasSaved = await save(toPublish);
    if (!wasSaved) {
      setBusy(false);
      return;
    }
    let result = await review.publishDraft(id(), {
      expectedRevision: draft.revision(),
    });
    if (!result.ok && result.code === 'draft_stale') {
      const force = await confirm(
        'El documento cambió',
        'Alguien reemplazó el documento publicado después de que empezaste este borrador. Si publicas, tu borrador lo pisa. ¿Publicar de todos modos?',
        'Publicar de todos modos',
        true,
      );
      if (force) {
        result = await review.publishDraft(id(), {
          expectedRevision: draft.revision(),
          force: true,
        });
      }
    }
    setBusy(false);
    if (!result.ok) {
      draft.setProblem(result);
      return;
    }
    review.flash('Documento publicado.');
    navigate(documentPath(id()));
  }

  return { saving, busy, save: () => save(), discard, publish, leave };
}
