import { Show } from 'solid-js';
import BlockListSheet from './components/BlockListSheet/BlockListSheet';
import NavigationBar from './components/NavigationBar/NavigationBar';
import { NAV_TITLES } from './ReviewNavigation.constants';
import type { ReviewNavigation as Navigation } from './ReviewNavigation.hooks';

/** La hoja con la lista de bloques y la barra inferior de recorrido. */
export default function ReviewNavigation(props: { navigation: Navigation }) {
  return (
    <>
      <BlockListSheet
        kind={props.navigation.listKind()}
        items={props.navigation.listItems()}
        onPick={props.navigation.pick}
        onClose={props.navigation.closeList}
      />
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
    </>
  );
}
