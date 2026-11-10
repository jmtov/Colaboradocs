import { type Component, createSignal, For } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import MonitorIcon from '@/icons/MonitorIcon';
import MoonIcon from '@/icons/MoonIcon';
import SunIcon from '@/icons/SunIcon';
import styles from './ThemeSwitch.module.css';
import { applyTheme, readTheme, type Theme } from './theme.utils';

const OPTIONS: {
  value: Theme;
  label: string;
  icon: Component<{ class?: string }>;
}[] = [
  { value: 'auto', label: 'Auto', icon: MonitorIcon },
  { value: 'light', label: 'Claro', icon: SunIcon },
  { value: 'dark', label: 'Oscuro', icon: MoonIcon },
];

export default function ThemeSwitch() {
  const [theme, setTheme] = createSignal<Theme>(readTheme());

  function choose(value: Theme) {
    applyTheme(value);
    setTheme(value);
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: fieldset arrastra estilos de formulario que no queremos
    <div class={styles.group} role="group" aria-label="Tema">
      <For each={OPTIONS}>
        {(option) => (
          <button
            type="button"
            class={styles.option}
            classList={{ [styles.on]: theme() === option.value }}
            aria-pressed={theme() === option.value}
            onClick={() => choose(option.value)}
          >
            <Dynamic component={option.icon} class={styles.icon} />
            {option.label}
          </button>
        )}
      </For>
    </div>
  );
}
