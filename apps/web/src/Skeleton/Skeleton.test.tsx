// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it } from 'vitest';
import DeckEditorSkeleton from '@/DeckEditor/DeckEditorSkeleton/DeckEditorSkeleton';
import DeckSkeleton from '@/DeckPage/DeckSkeleton/DeckSkeleton';
import DocumentSkeleton from '@/DocumentPage/DocumentSkeleton/DocumentSkeleton';
import EditorSkeleton from '@/EditorPage/EditorSkeleton/EditorSkeleton';
import HomeSkeleton from '@/HomePage/components/HomeSkeleton/HomeSkeleton';
import TasksSkeleton from '@/TasksTab/components/TasksSkeleton/TasksSkeleton';

const disposers: (() => void)[] = [];
afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
});

const screens = {
  home: HomeSkeleton,
  documento: DocumentSkeleton,
  'editor de documento': EditorSkeleton,
  presentación: DeckSkeleton,
  'editor de presentaciones': DeckEditorSkeleton,
  tareas: TasksSkeleton,
};

describe('cada pantalla tiene su skeleton, no un «Cargando…» genérico', () => {
  for (const [name, Screen] of Object.entries(screens)) {
    it(`${name}: avisa que carga y dibuja huecos, sin texto suelto`, () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      disposers.push(render(() => <Screen />, host));
      expect(host.querySelector('[role="status"][aria-label]')).not.toBeNull();
      expect(
        host.querySelectorAll('[aria-hidden="true"]').length,
      ).toBeGreaterThan(3);
      expect(host.textContent?.trim()).toBe('');
    });
  }
});
