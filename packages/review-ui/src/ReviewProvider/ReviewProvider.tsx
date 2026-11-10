import type { JSX } from 'solid-js';
import { createReviewStore } from '../store/createReviewStore';
import type { RoleField } from '../store/role.utils';
import { ReviewContext } from './review.context';

type Props = {
  /** Identifica el documento en el backend: otro documento, otro id. */
  documentId: string;
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
  const store = createReviewStore(
    props.documentId,
    browserStorage(),
    props.roleField,
  );
  store.start();
  return (
    <ReviewContext.Provider value={store}>
      {props.children}
    </ReviewContext.Provider>
  );
}
