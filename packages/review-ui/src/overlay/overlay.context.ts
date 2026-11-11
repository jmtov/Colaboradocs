import { createContext } from 'solid-js';
import type { OverlayApi } from './overlay.types';

export const OverlayContext = createContext<OverlayApi>();
