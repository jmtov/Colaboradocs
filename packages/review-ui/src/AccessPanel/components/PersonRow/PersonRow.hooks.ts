import type { ManagedReviewer } from '@colaboradocs/review-core';
import type { Accessor } from 'solid-js';
import { createSignal } from 'solid-js';
import type { ActionMenuItem } from '../../../ActionMenu/ActionMenu.types';
import ConfirmSheet from '../../../ConfirmSheet/ConfirmSheet';
import KeyIcon from '../../../icons/KeyIcon';
import PencilIcon from '../../../icons/PencilIcon';
import RotateCcwIcon from '../../../icons/RotateCcwIcon';
import TrashIcon from '../../../icons/TrashIcon';
import { useOverlay } from '../../../overlay/useOverlay';
import { useReview } from '../../../ReviewProvider/review.context';
import type { AccessOutcome } from '../../../store/createAccessStore';
import PinResultSheet from '../PinResultSheet/PinResultSheet';
import EditPersonSheet from './components/EditPersonSheet/EditPersonSheet';

/** Estado, acciones y acceso a datos de una fila de persona. */
export function usePersonRow(person: Accessor<ManagedReviewer>) {
  const review = useReview();
  const overlay = useOverlay();
  const access = review.access;
  const [busy, setBusy] = createSignal(false);

  /** Corre una acción; si falla, avisa. Devuelve su resultado, o null si ya había otra en curso. */
  async function run<T>(
    action: () => Promise<AccessOutcome<T>>,
    done?: string,
  ): Promise<AccessOutcome<T> | null> {
    if (busy()) return null;
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (!result.ok) review.flash(result.message);
    else if (done) review.flash(done);
    return result;
  }

  const confirm = (options: {
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
  }) => overlay.sheet(ConfirmSheet, options);

  async function regeneratePin() {
    const accepted = await confirm({
      title: 'Regenerar PIN',
      message: `El PIN actual deja de servir y ${person().name} queda fuera hasta recibir el nuevo.`,
      confirmLabel: 'Regenerar',
    });
    if (!accepted) return;
    const result = await run(() => access.regeneratePin(person().id));
    if (result?.ok)
      void overlay.sheet(PinResultSheet, { issued: result.value });
  }

  async function removePerson() {
    const accepted = await confirm({
      title: 'Eliminar persona',
      message: `${person().name} pierde el acceso. Sus comentarios se conservan.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (accepted) await run(() => access.remove(person().id));
  }

  const role = () => {
    const municipality = person().municipality;
    return municipality ? review.role.format(municipality) : null;
  };

  /** Las acciones del menú; las que cambian el acceso faltan si la persona está protegida. */
  function menuItems(): ActionMenuItem[] {
    const items: ActionMenuItem[] = [
      {
        label: 'Editar',
        icon: PencilIcon,
        onSelect: () =>
          void overlay.sheet(EditPersonSheet, {
            get person() {
              return person();
            },
          }),
      },
    ];
    if (person().locked) return items;
    items.push(
      {
        label: 'Restablecer dispositivos',
        icon: RotateCcwIcon,
        disabled: busy(),
        onSelect: () =>
          void run(
            () => access.resetDevices(person().id),
            'Dispositivos restablecidos.',
          ),
      },
      {
        label: 'Regenerar PIN',
        icon: KeyIcon,
        onSelect: () => void regeneratePin(),
      },
      {
        label: 'Eliminar',
        icon: TrashIcon,
        danger: true,
        onSelect: () => void removePerson(),
      },
    );
    return items;
  }

  /** Por qué faltan acciones, si la persona está protegida. */
  const lockedNote = (isMe: boolean) => {
    if (!person().locked) return undefined;
    return isMe
      ? 'Eres tú: no puedes cambiar tu propio acceso.'
      : 'Esta persona te dio acceso (o lo dio a quien te lo dio): no puedes cambiar su acceso.';
  };

  return {
    role,
    roleLabel: () => review.role.label,
    busy,
    menuItems,
    lockedNote,
    toggleAdmin: (isAdmin: boolean) =>
      run(() => access.setAdmin(person().id, isAdmin)),
  };
}
