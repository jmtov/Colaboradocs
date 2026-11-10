import type { JSX } from 'solid-js';
import { discoverLegacyPrefixes } from '../session/session.utils';
import { createReviewStore } from '../store/createReviewStore';
import type { RoleField } from '../store/role.utils';
import { ReviewContext } from './review.context';

type Props = {
  /**
   * Documento abierto, o nada en la home. La sesión es del espacio entero:
   * cambiar de documento no vuelve a pedir el PIN.
   */
  documentId?: string;
  /** Cómo se llama y se muestra el rol de cada persona. Por defecto «Rol», tal cual. */
  roleField?: RoleField;
  children: JSX.Element;
};

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export default function ReviewProvider(props: Props) {
  const storage = browserStorage();
  const store = createReviewStore({
    documentId: () => props.documentId ?? null,
    storage,
    // Sesiones de cuando eran por documento: se adoptan una vez.
    legacyPrefixes: discoverLegacyPrefixes(storage, 'review'),
    roleField: () => props.roleField,
  });
  store.start();
  return (
    <ReviewContext.Provider value={store}>
      {props.children}
    </ReviewContext.Provider>
  );
}
