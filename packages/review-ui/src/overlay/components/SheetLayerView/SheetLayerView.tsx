import { Dynamic } from 'solid-js/web';
import type { SheetLayer } from '../../overlay.types';

/** Monta el componente de una hoja con sus props más `open`, `onClose` y `close`. */
export default function SheetLayerView(props: { layer: SheetLayer }) {
  return (
    <Dynamic
      component={props.layer.component}
      {...props.layer.props}
      open={props.layer.open()}
      onClose={() => props.layer.close()}
      close={props.layer.close}
    />
  );
}
