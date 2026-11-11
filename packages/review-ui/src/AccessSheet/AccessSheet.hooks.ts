import { createSignal, onMount } from 'solid-js';
import { useOverlay } from '../overlay/useOverlay';
import { useReview } from '../ReviewProvider/review.context';
import AddPersonSheet from './components/AddPersonSheet/AddPersonSheet';

/** Estado, efectos y acceso a datos de la pantalla de accesos (solo admins). */
export function useAccessSheet() {
  const review = useReview();
  const overlay = useOverlay();
  const access = review.access;
  const [expanded, setExpanded] = createSignal<string | null>(null);

  // La hoja se monta al abrirse y se desmonta al cerrarse: la lista se pide una vez, al entrar.
  onMount(() => void access.load());

  const myId = () => review.snapshot()?.me.id ?? review.session()?.reviewer.id;

  function toggleExpanded(id: string) {
    setExpanded(expanded() === id ? null : id);
  }

  return {
    status: access.status,
    people: access.people,
    reload: () => void access.load(),
    openAdd: () => void overlay.sheet(AddPersonSheet, {}),
    expanded,
    toggleExpanded,
    myId,
  };
}
