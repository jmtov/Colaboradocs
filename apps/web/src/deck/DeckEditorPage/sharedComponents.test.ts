import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

const files = sources(import.meta.dirname);

describe('el editor de presentaciones usa los mismos componentes que el resto de la app', () => {
  it('sin botones sueltos con la clase «btn»: son `Button`', () => {
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/class="btn/);
    }
  });

  it('sin menús ni hojas propios: ActionMenu y BottomSheet son los de review-ui', () => {
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/ui\/ActionMenu|ui\/BottomSheet/);
      expect(source, file).not.toMatch(/popover=/);
    }
  });
});
