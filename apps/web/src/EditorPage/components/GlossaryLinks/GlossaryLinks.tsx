import { Button } from '@colaboradocs/review-ui';
import { createMemo, For, Show } from 'solid-js';
import { FieldGroup, FieldRow } from '@/FieldGroup/FieldGroup';
import TrashIcon from '@/icons/TrashIcon';
import {
  type GlossaryLinks as Links,
  orphanLinks,
  readTerms,
} from '../../glossary.utils';
import styles from './GlossaryLinks.module.css';

type Props = {
  /** El HTML de la sección glosario: de ahí salen los términos. */
  html: string;
  links: Links;
  onRemove: (form: string) => void;
};

/** Enlaces del glosario que apuntan a un término que ya no existe. */
export default function GlossaryLinks(props: Props) {
  const terms = createMemo(() => readTerms(props.html));
  const orphans = createMemo(() => orphanLinks(props.links, terms()));

  return (
    <Show when={orphans().length > 0}>
      <FieldGroup
        title="Enlaces sin término"
        hint="Apuntan a un término que ya no está en el glosario (¿lo renombraste?). Quítalos, o escribe el término como estaba."
      >
        <For each={orphans()}>
          {([form, term]) => (
            <FieldRow label={form}>
              <span class={styles.target}>→ {term}</span>
              <Button
                icon={TrashIcon}
                variant="danger"
                onClick={() => props.onRemove(form)}
              >
                Quitar
              </Button>
            </FieldRow>
          )}
        </For>
      </FieldGroup>
    </Show>
  );
}
