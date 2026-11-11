import { createMemo, For, Show } from 'solid-js';
import { FieldGroup, FieldRow } from '@/FieldGroup/FieldGroup';
import fieldStyles from '@/FieldGroup/FieldInput.module.css';
import {
  formsOf,
  type GlossaryLinks as Links,
  orphanLinks,
  readTerms,
} from '../../glossary.utils';
import styles from './GlossaryLinks.module.css';

type Props = {
  /** El HTML de la sección glosario: de ahí salen los términos. */
  html: string;
  links: Links;
  /** Cómo aparece un término en el texto (separado por comas). */
  onForms: (term: string, text: string) => void;
  onRemove: (form: string) => void;
};

/** Qué palabras del texto se enlazan solas a cada término del glosario. */
export default function GlossaryLinks(props: Props) {
  const terms = createMemo(() => readTerms(props.html));
  const orphans = createMemo(() => orphanLinks(props.links, terms()));

  return (
    <>
      <Show when={terms().length > 0}>
        <FieldGroup
          title="Enlaces en el texto"
          hint="Cómo aparece cada término en el texto, en minúsculas y separado por comas (p. ej. veeduría, veedurías): esas palabras se enlazan solas a su definición. Vacío, no se enlaza."
        >
          <For each={terms()}>
            {(term) => (
              <FieldRow label={term}>
                <input
                  class={fieldStyles.input}
                  value={formsOf(props.links, term).join(', ')}
                  placeholder="—"
                  // Al salir del campo, no en cada letra: la coma que se está escribiendo no se pierde.
                  onChange={(event) =>
                    props.onForms(term, event.currentTarget.value)
                  }
                />
              </FieldRow>
            )}
          </For>
        </FieldGroup>
      </Show>

      <Show when={orphans().length > 0}>
        <FieldGroup
          title="Enlaces sin término"
          hint="Apuntan a un término que ya no está en el glosario (¿lo renombraste?). Quítalos, o escribe el término como estaba."
        >
          <For each={orphans()}>
            {([form, term]) => (
              <FieldRow label={form}>
                <span class={styles.target}>→ {term}</span>
                <button
                  type="button"
                  class={styles.remove}
                  onClick={() => props.onRemove(form)}
                >
                  Quitar
                </button>
              </FieldRow>
            )}
          </For>
        </FieldGroup>
      </Show>
    </>
  );
}
