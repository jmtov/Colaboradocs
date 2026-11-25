// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it } from 'vitest';
import DeckEditorSkeleton from '@/deck/DeckEditorPage/DeckEditorSkeleton/DeckEditorSkeleton';
import DeckSkeleton from '@/deck/DeckPage/DeckSkeleton/DeckSkeleton';
import DocumentSkeleton from '@/document/DocumentPage/DocumentSkeleton/DocumentSkeleton';
import EditorSkeleton from '@/document/EditorPage/EditorSkeleton/EditorSkeleton';
import HomeSkeleton from '@/home/HomePage/components/HomeSkeleton/HomeSkeleton';
import TasksSkeleton from '@/home/HomePage/components/TasksTab/components/TasksSkeleton/TasksSkeleton';
import Skeleton from './Skeleton';

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

describe('Skeleton: el tamaño llega como variable CSS, no como estilo', () => {
  it('width y height pasan a --skeleton-w y --skeleton-h', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    disposers.push(render(() => <Skeleton width="6rem" height="2rem" />, host));
    const bone = host.querySelector('span') as HTMLElement;
    expect(bone.style.getPropertyValue('--skeleton-w')).toBe('6rem');
    expect(bone.style.getPropertyValue('--skeleton-h')).toBe('2rem');
    expect(bone.style.width).toBe('');
  });
});
