// @vitest-environment happy-dom
import { ReviewProvider } from '@colaboradocs/review-ui';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TopBar from './TopBar';

const disposers: (() => void)[] = [];
const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

function mount(isAdmin: boolean) {
  const reviewer = { id: 'r1', name: 'Ana', isAdmin, municipality: null };
  localStorage.setItem(
    'review:session',
    JSON.stringify({ token: 't', reviewer }),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const body =
        url === '/api/documents/mi-doc/review'
          ? { me: reviewer, comments: [], approvals: [], reviewers: {} }
          : [];
      return new Response(JSON.stringify(body));
    }),
  );
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(
    render(
      () => (
        <ReviewProvider documentId="mi-doc">
          <TopBar
            documentId="mi-doc"
            documentName="Doc"
            currentLabel="Inicio"
            currentHeading=""
            onOpenContents={() => {}}
            onPrint={() => {}}
          />
        </ReviewProvider>
      ),
      host,
    ),
  );
  return host;
}

const editLink = (host: HTMLElement) =>
  [...host.querySelectorAll('a')].find((link) => link.textContent === 'Editar');

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('TopBar', () => {
  it('un admin ve «Editar» y va al editor del documento', async () => {
    const host = mount(true);
    await wait();
    expect(editLink(host)?.getAttribute('href')).toBe('/d/mi-doc/editar');
  });

  it('quien no es admin no lo ve', async () => {
    const host = mount(false);
    await wait();
    expect(editLink(host)).toBeUndefined();
  });
});
