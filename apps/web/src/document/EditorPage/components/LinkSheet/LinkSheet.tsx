import { BottomSheet, Button } from '@colaboradocs/review-ui';
import CheckIcon from 'lucide-solid/icons/check';
import TrashIcon from 'lucide-solid/icons/trash';
import CloseIcon from 'lucide-solid/icons/x';
import { createSignal, Show } from 'solid-js';
import { normalizeLinkUrl } from '@/document/editor/link.utils';
import { FieldGroup, FieldRow } from '@/shared/ui/FieldGroup/FieldGroup';
import fieldStyles from '@/shared/ui/FieldGroup/FieldInput.module.css';
import styles from './LinkSheet.module.css';
import type { LinkSheetProps } from './LinkSheet.types';

/** Un enlace del texto: a dónde lleva y, si no hay texto elegido, cómo se lee. */
export default function LinkSheet(props: LinkSheetProps) {
  const [url, setUrl] = createSignal(props.state.href);
  const [text, setText] = createSignal(props.state.text);
  const normalized = () => normalizeLinkUrl(url());
  const askText = () => !props.state.hasSelection;
  const valid = () => normalized() !== null && (!askText() || text().trim());

  function apply() {
    const finalUrl = normalized();
    if (!finalUrl || !valid()) return;
    props.close({ url: finalUrl, text: text().trim() });
  }

  return (
    <BottomSheet
      open={props.open}
      kicker="Texto"
      title={props.state.active ? 'Editar el enlace' : 'Agregar un enlace'}
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <FieldGroup
          title="Enlace"
          hint="Una página web, un correo o un documento de este espacio (por ejemplo /d/acta-2026-11-18)."
        >
          <Show when={askText()}>
            <FieldRow label="Texto">
              <input
                class={fieldStyles.input}
                value={text()}
                maxLength={200}
                placeholder="Cómo se lee"
                onInput={(event) => setText(event.currentTarget.value)}
              />
            </FieldRow>
          </Show>
          <FieldRow label="Dirección">
            <input
              class={fieldStyles.input}
              value={url()}
              inputMode="url"
              autocapitalize="none"
              placeholder="https://…"
              onInput={(event) => setUrl(event.currentTarget.value)}
            />
          </FieldRow>
        </FieldGroup>
        <Show when={url().trim() !== '' && normalized() === null}>
          <p class={styles.problem}>Esa dirección no sirve como enlace.</p>
        </Show>

        <div class={styles.row}>
          <Show when={props.state.active}>
            <Button
              icon={TrashIcon}
              variant="danger"
              onClick={() => props.close({ remove: true })}
            >
              Quitar enlace
            </Button>
          </Show>
          <span class={styles.gap} />
          <Button icon={CloseIcon} onClick={() => props.close()}>
            Cancelar
          </Button>
          <Button
            icon={CheckIcon}
            variant="primary"
            disabled={!valid()}
            onClick={apply}
          >
            Aplicar
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
