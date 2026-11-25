import { installPopoverPolyfill } from '@colaboradocs/review-ui';
import { render } from 'solid-js/web';
import App from './App';
import './index.css';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { applyStoredTheme } from './ThemeSwitch/theme.utils';

installPopoverPolyfill();
applyStoredTheme();
registerServiceWorker();

const root = document.getElementById('root');
if (root) render(() => <App />, root);
