import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

/** Lo que va dentro de los `@media print { … }` de un archivo. */
function printBlocks(css: string): string {
  const found: string[] = [];
  const marker = '@media print {';
  let from = css.indexOf(marker);
  while (from !== -1) {
    let depth = 1;
    let index = from + marker.length;
    while (depth > 0 && index < css.length) {
      if (css[index] === '{') depth += 1;
      if (css[index] === '}') depth -= 1;
      index += 1;
    }
    found.push(css.slice(from + marker.length, index - 1));
    from = css.indexOf(marker, index);
  }
  return found.join('\n');
}

describe('vista de impresión (PDF)', () => {
  // Lo que es de pantalla (navegación, resumen, barras) no sale en papel.
  const hidden = [
    ['./TopBar/TopBar.module.css', '.top'],
    ['./SideNav/SideNav.module.css', '.side'],
    ['./ReviewSummary/ReviewSummary.module.css', '.summary'],
    ['./SectionCards/SectionCards.module.css', '.contents'],
    [
      './ReviewNavigation/components/NavigationBar/NavigationBar.module.css',
      '.bar',
    ],
    [
      '../../../packages/review-ui/src/BlockLayer/BlockLayer.module.css',
      '.notice',
    ],
    [
      '../../../packages/review-ui/src/BottomSheet/BottomSheet.module.css',
      '.sheet',
    ],
  ] as const;

  for (const [path, selector] of hidden) {
    it(`${path.split('/').pop()}: ${selector} se oculta al imprimir`, () => {
      const block = printBlocks(read(path));
      const rule = new RegExp(
        `${selector.replace('.', '\\.')}[^{]*\\{[^}]*display:\\s*none`,
      );
      expect(block).toMatch(rule);
    });
  }

  it('el papel es claro aunque la pantalla sea oscura', () => {
    const block = printBlocks(read('./index.css'));
    expect(block).toMatch(/--bg:\s*#fff/);
    expect(block).toMatch(/color-scheme:\s*light/);
  });

  it('los títulos no quedan solos al final de una página', () => {
    expect(printBlocks(read('./SectionView/SectionView.module.css'))).toMatch(
      /break-after:\s*avoid/,
    );
    expect(printBlocks(read('./Prose/Prose.module.css'))).toMatch(
      /break-after:\s*avoid/,
    );
  });
});
