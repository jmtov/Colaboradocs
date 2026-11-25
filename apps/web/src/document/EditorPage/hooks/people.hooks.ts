import { useOverlay, useReview } from '@colaboradocs/review-ui';
import { createEffect } from 'solid-js';
import PeopleSheet from '../components/PeopleSheet/PeopleSheet';
import PersonSheet from '../components/PersonSheet/PersonSheet';
import { addPerson, withoutPerson } from '../people.utils';
import type { EditorDraft } from './draft.hooks';
import type { EditorInstance } from './instance.hooks';

type Deps = { draft: EditorDraft; instance: EditorInstance };

/** Las personas: responsable y participantes, y los nombres que el texto menciona. */
export function usePeopleActions({ draft, instance }: Deps) {
  const review = useReview();
  const overlay = useOverlay();
  const everyone = () => Object.values(review.snapshot()?.reviewers ?? {});

  /**
   * Elegir entre las personas del espacio: quién responde por una iniciativa (una) o quiénes
   * estuvieron en un acta (varias; parten elegidas las que el texto menciona).
   */
  async function pickPeople(field: 'owner' | 'attendees') {
    const single = field === 'owner';
    const result = await overlay.sheet(PeopleSheet, {
      kicker: single ? 'Iniciativa' : 'Acta',
      title: single ? 'Responsable' : 'Participantes',
      hint: single
        ? 'Elige a quien responde por esta iniciativa.'
        : 'Marca a quienes estuvieron en la reunión; las personas de las que habla el documento parten elegidas.',
      single,
      people: everyone(),
      current: draft.details()[field],
      mentioned: single ? [] : [...new Set(Object.values(draft.people()))],
    });
    if (result !== undefined) {
      draft.setDetails((current) => ({ ...current, [field]: result }));
    }
  }

  /** Elegir a una persona del espacio y escribir su nombre en el cursor; al tocarlo se ve su tarjeta. */
  async function mention() {
    const editor = instance.editor();
    if (!editor) return;
    const result = await overlay.sheet(PersonSheet, { people: everyone() });
    if (!result || 'remove' in result) return;
    draft.setPeople((current) => addPerson(current, result.text, result.name));
    editor.chain().focus().insertContent(`${result.text} `).run();
  }

  /** Tocar un nombre de persona del texto: cambiar a quién apunta o quitar la mención. */
  async function editPerson(key: string, name: string) {
    const result = await overlay.sheet(PersonSheet, {
      people: everyone(),
      current: name,
    });
    if (!result) return;
    if ('remove' in result) {
      draft.setPeople((current) => withoutPerson(current, key));
    } else {
      draft.setPeople((current) => addPerson(current, key, result.name));
    }
  }

  // Los nombres marcados en el texto siguen a las personas: al cambiarlas, se repintan.
  createEffect(() => {
    draft.people();
    const editor = instance.editor();
    if (editor) {
      editor.view.dispatch(editor.state.tr.setMeta('people', true));
    }
  });

  return { pickPeople, mention, editPerson };
}
