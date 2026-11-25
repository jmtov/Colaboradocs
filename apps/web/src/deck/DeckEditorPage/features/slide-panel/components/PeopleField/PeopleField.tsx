import { type Field, PERSON_FIELDS } from '@colaboradocs/deck-core';
import type { Path } from '@/deck/DeckEditorPage/features/deck/deck.utils';
import ListField from '../ListField/ListField';

interface PeopleFieldProps {
  field: Field;
  value: Record<string, unknown>[] | undefined;
  path: Path;
}

/** Una lista de personas (nombre y municipio): una lista común con los campos de una persona. */
export default function PeopleField(props: PeopleFieldProps) {
  const list = (): Extract<Field, { type: 'list' }> => ({
    key: props.field.key,
    label: props.field.label,
    type: 'list',
    itemLabel: 'Persona',
    fields: PERSON_FIELDS,
    sample: [{ name: 'Nombre Apellido', place: 'Municipio' }],
  });
  return <ListField field={list()} value={props.value} path={props.path} />;
}
