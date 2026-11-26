import { useOverlay, useReview } from '@colaboradocs/review-ui';
import { createEffect } from 'solid-js';
import { selectedText } from '@/document/editor/selection.utils';
import PeopleSheet from '../components/PeopleSheet/PeopleSheet';
import PersonSheet from '../components/PersonSheet/PersonSheet';
import { MAX_PERSON_TEXT } from '../people.constants';
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

  /**
   * Mencionar a una persona del espacio: al tocar el texto se ve su tarjeta. Con una
   * selección, ese es el texto; sin ella, su nombre se escribe en el cursor.
   */
  async function mention() {
    const editor = instance.editor();
    if (!editor) return;
    const found = selectedText(editor);
    const selected =
      found && found.text.length <= MAX_PERSON_TEXT ? found : null;
    const end = editor.state.selection.to;
    const result = await overlay.sheet(PersonSheet, {
      people: everyone(),
      selected: selected?.text,
    });
    if (!result || 'remove' in result) return;
    draft.setPeople((current) => addPerson(current, result.text, result.name));
    const chain = editor.chain().focus();
    if (!selected) {
      // Sin un texto que sirva se escribe al final de lo seleccionado: no se borra nada.
      chain.setTextSelection(end).insertContent(`${result.text} `).run();
    } else if (result.text === selected.text) {
      // El texto ya está escrito, con su formato: solo queda registrado a quién apunta.
      chain.setTextSelection(selected.to).run();
    } else {
      chain.insertContentAt(selected, result.text).run();
    }
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
