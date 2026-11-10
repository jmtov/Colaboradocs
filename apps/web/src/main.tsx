import { render } from 'solid-js/web';
import App from './App';
import './index.css';
import { applyStoredTheme } from './ThemeSwitch/theme.utils';

applyStoredTheme();

const root = document.getElementById('root');
if (root) render(() => <App />, root);
