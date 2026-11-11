import { onMount } from 'solid-js';
import { useOverlay } from '../overlay/useOverlay';
import { useReview } from '../ReviewProvider/review.context';
import AddPersonSheet from './components/AddPersonSheet/AddPersonSheet';

/** Estado, efectos y acceso a datos del panel de accesos (solo admins). */
export function useAccessPanel() {
  const review = useReview();
  const overlay = useOverlay();
  const access = review.access;

  // El panel se monta al entrar a la página: la lista se pide una vez.
  onMount(() => void access.load());

  const myId = () => review.snapshot()?.me.id ?? review.session()?.reviewer.id;

  return {
    status: access.status,
    people: access.people,
    reload: () => void access.load(),
    openAdd: () => void overlay.sheet(AddPersonSheet, {}),
    myId,
  };
}
