import { SLIDE_TEMPLATES } from '@colaboradocs/deck-core';
import { ActionMenu, type ActionMenuGroup } from '@colaboradocs/review-ui';
import { For, Show } from 'solid-js';
import { deckStore } from '@/deck/DeckEditorPage/features/deck/deck.store';
import { issuesOfSlide } from '@/deck/DeckEditorPage/features/deck/deck.utils';
import WarningDot from '@/deck/DeckEditorPage/features/ui/WarningDot/WarningDot';
import ArrowDownIcon from '@/shared/icons/ArrowDownIcon';
import ArrowUpIcon from '@/shared/icons/ArrowUpIcon';
import CopyIcon from '@/shared/icons/CopyIcon';
import PlusIcon from '@/shared/icons/PlusIcon';
import TrashIcon from '@/shared/icons/TrashIcon';
import styles from './SlideList.module.css';
import { slideLabel, slideSummary } from './SlideList.utils';

const addItems = (after: number) => [
  ...SLIDE_TEMPLATES.map((template) => ({
    label: template.label,
    description: template.help,
    icon: PlusIcon,
    onSelect: () => deckStore.addSlide(template.id, after),
  })),
];

/** Las acciones de una slide de la lista: moverla, duplicarla, agregar otra después y eliminarla. */
function rowMenu(index: number): ActionMenuGroup[] {
  const last = deckStore.deck.slides.length - 1;
  return [
    {
      items: [
        {
          label: 'Subir',
          icon: ArrowUpIcon,
          disabled: index === 0,
          onSelect: () => deckStore.moveSlide(index, index - 1),
        },
        {
          label: 'Bajar',
          icon: ArrowDownIcon,
          disabled: index === last,
          onSelect: () => deckStore.moveSlide(index, index + 1),
        },
        {
          label: 'Duplicar',
          icon: CopyIcon,
          onSelect: () => deckStore.duplicateSlide(index),
        },
      ],
    },
    { title: 'Agregar después', items: addItems(index) },
    {
      items: [
        {
          label: 'Eliminar',
          icon: TrashIcon,
          danger: true,
          disabled: last === 0,
          onSelect: () => {
            if (
              window.confirm(
                '¿Eliminar esta slide? Se puede recuperar con Deshacer.',
              )
            )
              deckStore.removeSlide(index);
          },
        },
      ],
    },
  ];
}

export default function SlideList() {
  return (
    <div class={styles.wrapper}>
      <ol class={styles.list}>
        <For each={deckStore.deck.slides}>
          {(slide, i) => (
            <li
              class={styles.row}
              classList={{
                [styles.on as string]: i() === deckStore.slideIndex(),
              }}
            >
              <button
                type="button"
                class={styles.item}
                onClick={() => deckStore.select(i())}
              >
                <span class={styles.number}>
                  {String(i() + 1).padStart(2, '0')}
                </span>
                <span class={styles.text}>
                  <span class={styles.label}>{slideLabel(slide)}</span>
                  <small class={styles.kind}>{slideSummary(slide)}</small>
                </span>
                <Show when={issuesOfSlide(deckStore.issues(), i()).length > 0}>
                  <WarningDot
                    messages={issuesOfSlide(deckStore.issues(), i()).map(
                      (issue) => issue.message,
                    )}
                  />
                </Show>
              </button>
              <span class={styles.more}>
                <ActionMenu
                  size="xs"
                  label="Acciones de la slide"
                  groups={rowMenu(i())}
                />
              </span>
            </li>
          )}
        </For>
      </ol>
      <div class={styles.add}>
        <ActionMenu
          size="sm"
          label="Agregar slide al final"
          triggerIcon={PlusIcon}
          triggerLabel="Agregar slide"
          groups={[
            {
              title: 'Agregar al final',
              items: addItems(deckStore.deck.slides.length - 1),
            },
          ]}
        />
      </div>
    </div>
  );
}
