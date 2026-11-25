import type { Field } from '@colaboradocs/deck-core';
import { For, Match, Switch } from 'solid-js';
import type { Path } from '@/deck/DeckEditorPage/features/deck/deck.utils';
import BlocksField from '../BlocksField/BlocksField';
import FieldCard from '../FieldCard/FieldCard';
import FieldInput from '../FieldInput/FieldInput';
import FieldRow from '../FieldRow/FieldRow';
import FieldSection from '../FieldSection/FieldSection';
import GridSizeField from '../GridSizeField/GridSizeField';
import ListField from '../ListField/ListField';
import ObjectField from '../ObjectField/ObjectField';
import PeopleField from '../PeopleField/PeopleField';
import PositionField from '../PositionField/PositionField';
import styles from './FieldForm.module.css';
import { groupFields } from './FieldForm.utils';

interface FieldFormProps {
  fields: Field[];
  /** El objeto que se edita (la slide, un bloque, un ítem). */
  value: Record<string, unknown>;
  path: Path;
  /** Título de las filas que no pertenecen a ningún grupo (p. ej. «Opciones de Lista»). */
  untitled?: string;
}

/**
 * El formulario de un objeto: los campos de un solo valor van en tarjetas de filas (etiqueta a la
 * izquierda, valor a la derecha); cada grupo, lista o hueco de bloques es una sección con título.
 */
export default function FieldForm(props: FieldFormProps) {
  const groups = () => groupFields(props.fields);
  return (
    <div class={styles.form}>
      <For each={groups()}>
        {(group) => (
          <Switch>
            <Match when={group.kind === 'rows' && group}>
              {(rows) => (
                <FieldSection title={rows().title ?? props.untitled}>
                  <FieldCard>
                    <For each={rows().fields}>
                      {(field) => (
                        <FieldRow
                          label={field.label}
                          required={field.required}
                          help={field.help}
                          tall={
                            field.type === 'longtext' || field.type === 'lines'
                          }
                        >
                          <FieldInput
                            field={field}
                            value={props.value[field.key]}
                            path={[...props.path, field.key]}
                          />
                        </FieldRow>
                      )}
                    </For>
                  </FieldCard>
                </FieldSection>
              )}
            </Match>
            <Match when={group.kind === 'section' && group.field}>
              {(field) => (
                <SectionField
                  field={field()}
                  value={props.value}
                  path={props.path}
                />
              )}
            </Match>
          </Switch>
        )}
      </For>
    </div>
  );
}

function SectionField(props: {
  field: Field;
  value: Record<string, unknown>;
  path: Path;
}) {
  const at = () => [...props.path, props.field.key];
  const stored = () => props.value[props.field.key];
  return (
    <Switch>
      <Match when={props.field.type === 'object' && props.field}>
        {(f) => (
          <ObjectField
            field={f() as Extract<Field, { type: 'object' }>}
            value={stored() as Record<string, unknown> | undefined}
            path={at()}
          />
        )}
      </Match>
      <Match when={props.field.type === 'list' && props.field}>
        {(f) => (
          <ListField
            field={f() as Extract<Field, { type: 'list' }>}
            value={stored() as Record<string, unknown>[] | undefined}
            path={at()}
          />
        )}
      </Match>
      <Match when={props.field.type === 'people' && props.field}>
        {(f) => (
          <PeopleField
            field={f()}
            value={stored() as Record<string, unknown>[] | undefined}
            path={at()}
          />
        )}
      </Match>
      <Match when={props.field.type === 'gridsize'}>
        <GridSizeField path={props.path} />
      </Match>
      <Match when={props.field.type === 'position'}>
        <PositionField path={props.path} value={props.value} />
      </Match>
      <Match when={props.field.type === 'blocks' && props.field}>
        {(f) => (
          <BlocksField
            field={f() as Extract<Field, { type: 'blocks' }>}
            value={stored() as Record<string, unknown>[] | undefined}
            path={at()}
          />
        )}
      </Match>
    </Switch>
  );
}
