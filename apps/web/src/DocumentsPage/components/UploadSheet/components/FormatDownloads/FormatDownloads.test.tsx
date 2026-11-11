// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FormatDownloads from './FormatDownloads';

const wait = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));
const disposers: (() => void)[] = [];

/** Captura qué se descarga: el nombre del archivo y su contenido. */
function captureDownloads() {
  const downloads: { name: string; blob: Blob }[] = [];
  let lastBlob: Blob | undefined;
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    lastBlob = blob as Blob;
    return 'blob:test';
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    if (lastBlob) downloads.push({ name: this.download, blob: lastBlob });
  });
  return downloads;
}

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(render(() => <FormatDownloads />, host));
  return host;
}

const button = (host: HTMLElement, text: string) => {
  const found = [...host.querySelectorAll('button')].find((b) =>
    b.textContent?.includes(text),
  );
  if (!found) throw new Error(`falta el botón «${text}»`);
  return found;
};

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('FormatDownloads', () => {
  it('descarga el ejemplo como ejemplo.json, un documento válido', async () => {
    const downloads = captureDownloads();
    const host = mount();
    button(host, 'Ejemplo').click();
    await wait();
    expect(downloads).toHaveLength(1);
    expect(downloads[0]?.name).toBe('ejemplo.json');
    const parsed = JSON.parse((await downloads[0]?.blob.text()) ?? '');
    expect(parsed.id).toBe('ejemplo');
    expect(parsed.sections.length).toBeGreaterThan(0);
  });

  it('descarga la guía como formato-colaboradocs.md, con el ejemplo adentro', async () => {
    const downloads = captureDownloads();
    const host = mount();
    button(host, 'Guía').click();
    await wait();
    expect(downloads).toHaveLength(1);
    expect(downloads[0]?.name).toBe('formato-colaboradocs.md');
    const text = (await downloads[0]?.blob.text()) ?? '';
    expect(text).toContain('**Para Claude:**');
    expect(text).toContain('"id": "ejemplo"');
  });
});
