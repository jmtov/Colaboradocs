import type { SheetLayerProps } from '@colaboradocs/review-ui';
import { BottomSheet } from '@colaboradocs/review-ui';
import { For } from 'solid-js';
import { deckStore } from '@/DeckEditor/features/deck/deck.store';
import { FieldGroup, FieldRow } from '@/FieldGroup/FieldGroup';
import fieldStyles from '@/FieldGroup/FieldInput.module.css';

/** La configuración general de la presentación: el tema y la variante. Los cambios se aplican al momento y se ven en la vista previa. */
export default function DeckSettingsSheet(props: SheetLayerProps) {
  const variants = () => Object.entries(deckStore.theme()?.variants ?? {});

  return (
    <BottomSheet
      open={props.open}
      kicker="Presentación"
      title="Configuración"
      compact
      onClose={props.onClose}
    >
      <FieldGroup
        title="Aspecto"
        hint="El tema es la organización; la variante, el evento. Los cambios se ven al momento y se pueden deshacer."
      >
        <FieldRow label="Tema">
          <select
            class={fieldStyles.input}
            value={deckStore.deck.theme}
            onChange={(event) => deckStore.setTheme(event.currentTarget.value)}
          >
            <For each={deckStore.themes()}>
              {(theme) => <option value={theme.id}>{theme.name}</option>}
            </For>
          </select>
        </FieldRow>
        <FieldRow label="Variante">
          <select
            class={fieldStyles.input}
            value={deckStore.deck.variant ?? ''}
            onChange={(event) =>
              deckStore.setVariant(event.currentTarget.value || undefined)
            }
          >
            <option value="">Sin variante</option>
            <For each={variants()}>
              {([id, variant]) => <option value={id}>{variant.name}</option>}
            </For>
          </select>
        </FieldRow>
      </FieldGroup>
    </BottomSheet>
  );
}
