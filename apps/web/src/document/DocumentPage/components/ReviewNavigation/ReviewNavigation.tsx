import { Show } from 'solid-js';
import NavigationBar from './components/NavigationBar/NavigationBar';
import { NAV_TITLES } from './ReviewNavigation.constants';
import type { ReviewNavigation as Navigation } from './ReviewNavigation.hooks';

/** La barra inferior de recorrido. La lista de bloques es una hoja del overlay. */
export default function ReviewNavigation(props: { navigation: Navigation }) {
  return (
    <Show when={props.navigation.barKind()}>
      {(kind) => (
        <NavigationBar
          title={NAV_TITLES[kind()]}
          index={props.navigation.barIndex()}
          total={props.navigation.barTotal()}
          onPrevious={props.navigation.previous}
          onNext={props.navigation.next}
          onClose={props.navigation.closeBar}
        />
      )}
    </Show>
  );
}
