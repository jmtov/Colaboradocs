import { TEST_CASES } from '@colaboradocs/deck-core';
import { deckStore } from '@/DeckEditor/features/deck/deck.store';
import ActionMenu from '@/DeckEditor/features/ui/ActionMenu/ActionMenu';
import TypeIcon from '@/DeckEditor/features/ui/icons/TypeIcon';

/** «Probar con otros textos»: un menú con los casos; solo cambia la vista previa, no el deck. */
export default function TestCaseMenu() {
  const groups = () => [
    {
      title: 'Probar con otros textos',
      items: [
        {
          label: 'Tal como está',
          help: 'El contenido escrito.',
          checked: deckStore.testCase() === null,
          onSelect: () => deckStore.setTestCase(null),
        },
        ...TEST_CASES.map((c) => ({
          label: c.label,
          help: c.help,
          checked: deckStore.testCase() === c.id,
          onSelect: () => deckStore.setTestCase(c.id),
        })),
      ],
    },
  ];
  return (
    <ActionMenu
      label="Probar con otros textos (solo en la vista previa)"
      trigger={<TypeIcon />}
      groups={groups()}
    />
  );
}
