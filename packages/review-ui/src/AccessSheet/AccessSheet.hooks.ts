import { type Accessor, createEffect, createSignal } from 'solid-js';
import { useReview } from '../ReviewProvider/review.context';

/** Estado, efectos y acceso a datos de la pantalla de accesos (solo admins). */
export function useAccessSheet(open: Accessor<boolean>) {
  const review = useReview();
  const access = review.access;
  const [adding, setAdding] = createSignal(false);
  const [expanded, setExpanded] = createSignal<string | null>(null);

  createEffect(() => {
    if (open()) void access.load();
    else setExpanded(null);
  });

  const myId = () => review.snapshot()?.me.id ?? review.session()?.reviewer.id;

  function toggleExpanded(id: string) {
    setExpanded(expanded() === id ? null : id);
  }

  return {
    status: access.status,
    people: access.people,
    reload: () => void access.load(),
    adding,
    openAdd: () => setAdding(true),
    closeAdd: () => setAdding(false),
    expanded,
    toggleExpanded,
    myId,
  };
}
