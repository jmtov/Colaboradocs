import { TEST_CASES } from '@colaboradocs/deck-core';
import { ActionMenu, type ActionMenuGroup } from '@colaboradocs/review-ui';
import { deckStore } from '@/DeckEditor/features/deck/deck.store';
import TypeIcon from '@/icons/TypeIcon';

/** «Probar con otros textos»: un menú con los casos; solo cambia la vista previa, no el deck. */
export default function TestCaseMenu() {
  const groups = (): ActionMenuGroup[] => [
    {
      title: 'Probar con otros textos',
      items: [
        {
          label: 'Tal como está',
          description: 'El contenido escrito.',
          checked: deckStore.testCase() === null,
          onSelect: () => deckStore.setTestCase(null),
        },
        ...TEST_CASES.map((c) => ({
          label: c.label,
          description: c.help,
          checked: deckStore.testCase() === c.id,
          onSelect: () => deckStore.setTestCase(c.id),
        })),
      ],
    },
  ];
  return (
    <ActionMenu
      size="sm"
      label="Probar con otros textos (solo en la vista previa)"
      triggerIcon={TypeIcon}
      groups={groups()}
    />
  );
}
