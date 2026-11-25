import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');
const index = read('../index.css');

describe('espaciado de la home', () => {
  it('hay una escala de espaciado y un ritmo propio para las listas', () => {
    for (const step of [1, 2, 3, 4, 5, 6, 7])
      expect(index, `--space-${step}`).toMatch(new RegExp(`--space-${step}:`));
    expect(index).toMatch(/--list-gap:\s*var\(--space-/);
  });

  it('el marco, los tabs y las listas toman sus medidas de la escala, no de rem sueltos', () => {
    for (const file of [
      './HomeShell.module.css',
      './components/HomeTabs/HomeTabs.module.css',
      '../ListFilter/ListFilter.module.css',
      '../HomePage/components/DocumentsTab/DocumentsTab.module.css',
      '../HomePage/components/DecksTab/DecksTab.module.css',
    ]) {
      const css = read(file);
      // el hueco entre la barra, el resumen y la lista es el mismo en todas
      expect(css, file).not.toMatch(/(?<![-\w])gap:\s*1rem/);
    }
    expect(read('../TasksTab/TasksTab.module.css')).toMatch(
      /\.content \{[^}]*gap:\s*var\(--list-gap\)/,
    );
    // arriba de la barra (bajo los tabs) y abajo (hasta la lista) hay el mismo hueco
    expect(read('./components/HomeTabs/HomeTabs.module.css')).toMatch(
      /\.bar \{[^}]*margin-bottom:\s*var\(--list-gap\)/,
    );
    expect(read('../ListFilter/ListFilter.module.css')).toMatch(
      /\.root \{[^}]*gap:\s*var\(--list-gap\)/,
    );
  });
});
