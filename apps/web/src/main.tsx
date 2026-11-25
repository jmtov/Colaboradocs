import { installPopoverPolyfill } from '@colaboradocs/review-ui';
import { render } from 'solid-js/web';
import App from './app/App';
import './index.css';
import { registerServiceWorker } from './app/pwa/registerServiceWorker';
import { applyStoredTheme } from './shared/ui/ThemeSwitch/theme.utils';

installPopoverPolyfill();
applyStoredTheme();
registerServiceWorker();

const root = document.getElementById('root');
if (root) render(() => <App />, root);
