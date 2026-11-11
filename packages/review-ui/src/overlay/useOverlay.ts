import { useContext } from 'solid-js';
import { OverlayContext } from './overlay.context';
import type { OverlayApi } from './overlay.types';

export function useOverlay(): OverlayApi {
  const api = useContext(OverlayContext);
  if (!api) throw new Error('useOverlay necesita un <OverlayProvider>.');
  return api;
}
