import {
  isIsoDate,
  MAX_TASK_TITLE_LENGTH,
  type Task,
  type TaskPatch,
} from '@colaboradocs/review-core';
import { BottomSheet, Button } from '@colaboradocs/review-ui';
import CheckIcon from 'lucide-solid/icons/check';
import CloseIcon from 'lucide-solid/icons/x';
import { createSignal, For, Show } from 'solid-js';
import { FieldGroup, FieldRow } from '@/shared/ui/FieldGroup/FieldGroup';
import fieldStyles from '@/shared/ui/FieldGroup/FieldInput.module.css';
import styles from './NewTaskSheet.module.css';
import type { NewTaskSheetProps } from './NewTaskSheet.types';

/** Una tarea nueva: qué, para cuándo, de qué documento y, si eres admin, para quién. */
export default function NewTaskSheet(props: NewTaskSheetProps) {
  const editing = () => props.task !== undefined;
  const [title, setTitle] = createSignal(props.task?.title ?? '');
  const [dueDate, setDueDate] = createSignal(props.task?.dueDate ?? '');
  const [documentId, setDocumentId] = createSignal(props.documentId ?? '');
  const [assigneeId, setAssigneeId] = createSignal(
    props.task?.assigneeId ?? props.meId,
  );
  const valid = () => title().trim() !== '' && isIsoDate(dueDate());

  /** Solo lo que cambió respecto de la tarea que se edita. */
  function changes(task: Task): TaskPatch {
    return {
      ...(title().trim() !== task.title ? { title: title().trim() } : {}),
      ...(dueDate() !== task.dueDate ? { dueDate: dueDate() } : {}),
      ...(assigneeId() !== task.assigneeId ? { assigneeId: assigneeId() } : {}),
    };
  }

  function save() {
    if (!valid()) return;
    if (props.task) {
      const patch = changes(props.task);
      if (Object.keys(patch).length === 0) props.close();
      else props.close(patch);
      return;
    }
    props.close({
      title: title().trim(),
      dueDate: dueDate(),
      documentId: documentId() || null,
      ...(assigneeId() !== props.meId ? { assigneeId: assigneeId() } : {}),
    });
  }

  return (
    <BottomSheet
      open={props.open}
      kicker="Tareas"
      title={editing() ? 'Editar la tarea' : 'Nueva tarea'}
      compact
      onClose={props.onClose}
    >
      <div class={styles.content}>
        <FieldGroup title="Tarea">
          <FieldRow label="Qué">
            <input
              class={fieldStyles.input}
              value={title()}
              maxLength={MAX_TASK_TITLE_LENGTH}
              placeholder="Escribir a Abejorral"
              onInput={(event) => setTitle(event.currentTarget.value)}
            />
          </FieldRow>
          <FieldRow label="Fecha límite">
            <input
              class={fieldStyles.input}
              type="date"
              min={editing() ? undefined : props.today}
              value={dueDate()}
              onInput={(event) => setDueDate(event.currentTarget.value)}
            />
          </FieldRow>
          <Show when={!props.documentLocked && !editing()}>
            <FieldRow label="Documento">
              <select
                class={fieldStyles.input}
                value={documentId()}
                onChange={(event) => setDocumentId(event.currentTarget.value)}
              >
                <option value="">Ninguno</option>
                <For each={props.documents}>
                  {(item) => <option value={item.id}>{item.title}</option>}
                </For>
              </select>
            </FieldRow>
          </Show>
          <Show when={props.people.length > 0}>
            <FieldRow label="Responsable">
              <select
                class={fieldStyles.input}
                value={assigneeId()}
                onChange={(event) => setAssigneeId(event.currentTarget.value)}
              >
                <For each={props.people}>
                  {(person) => (
                    <option value={person.id}>
                      {person.id === props.meId ? 'Yo' : person.name}
                    </option>
                  )}
                </For>
              </select>
            </FieldRow>
          </Show>
        </FieldGroup>
        <div class={styles.row}>
          <Button icon={CloseIcon} onClick={() => props.close()}>
            Cancelar
          </Button>
          <Button
            icon={CheckIcon}
            variant="primary"
            disabled={!valid()}
            onClick={save}
          >
            {editing() ? 'Guardar' : 'Crear tarea'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
