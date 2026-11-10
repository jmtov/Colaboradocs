// @vitest-environment happy-dom
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FilePicker from './FilePicker';

const disposers: (() => void)[] = [];

function mount(props: Partial<Parameters<typeof FilePicker>[0]> = {}) {
  const onFile = vi.fn();
  const host = document.createElement('div');
  document.body.appendChild(host);
  disposers.push(
    render(
      () => (
        <FilePicker
          accept=".md"
          file={null}
          reading={false}
          onFile={onFile}
          {...props}
        />
      ),
      host,
    ),
  );
  return { host, onFile };
}

const file = (name = 'doc.md', content = '# Hola') => new File([content], name);

/** Un evento de arrastre con archivos (happy-dom no arma `dataTransfer`). */
function dragEvent(type: string, files: File[] = []) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { files } });
  return event;
}

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = '';
});

describe('FilePicker', () => {
  it('habla en español y no usa el texto del selector nativo', () => {
    const { host } = mount();
    expect(host.textContent).toContain('Arrastra tu archivo aquí');
    expect(host.textContent).toContain('o haz clic para elegirlo');
    expect(host.textContent).toContain('Word (.docx), Markdown (.md) o JSON');
    expect(host.textContent).not.toContain('Choose File');
    expect(host.textContent).not.toContain('no file selected');
  });

  it('la zona es un botón plano (no se levanta al pasar el cursor) que abre el selector del sistema', () => {
    const { host } = mount();
    const zone = host.querySelector('button') as HTMLButtonElement;
    expect(zone.hasAttribute('data-flat')).toBe(true);
    const input = host.querySelector('input[type="file"]') as HTMLInputElement;
    const click = vi.spyOn(input, 'click');
    zone.click();
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('el input nativo está oculto (no se enfoca ni se anuncia) y solo acepta los formatos indicados', () => {
    const { host } = mount();
    const input = host.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.hidden).toBe(true);
    expect(input.getAttribute('accept')).toBe('.md');
  });

  it('elegir un archivo con el selector del sistema lo entrega', () => {
    const { host, onFile } = mount();
    const input = host.querySelector('input[type="file"]') as HTMLInputElement;
    const chosen = file('elegido.md');
    Object.defineProperty(input, 'files', {
      value: [chosen],
      configurable: true,
    });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onFile).toHaveBeenCalledWith(chosen);
  });

  it('soltar un archivo sobre la zona lo entrega', () => {
    const { host, onFile } = mount();
    const dropped = file('soltado.docx');
    const event = dragEvent('drop', [dropped]);
    (host.firstElementChild as HTMLElement).dispatchEvent(event);
    expect(onFile).toHaveBeenCalledWith(dropped);
    // y se evita que el navegador abra el archivo en la pestaña
    expect(event.defaultPrevented).toBe(true);
  });

  it('al arrastrar encima cambia el mensaje, y vuelve al salir', () => {
    const { host } = mount();
    const zone = host.querySelector('button') as HTMLButtonElement;
    zone.dispatchEvent(dragEvent('dragenter'));
    expect(host.textContent).toContain('Suéltalo aquí');
    // cruzar un hijo dispara dragleave + dragenter: no debe parpadear
    zone.dispatchEvent(dragEvent('dragleave'));
    zone.dispatchEvent(dragEvent('dragenter'));
    expect(host.textContent).toContain('Suéltalo aquí');
    zone.dispatchEvent(dragEvent('dragleave'));
    expect(host.textContent).toContain('Arrastra tu archivo aquí');
  });

  it('con un archivo elegido muestra su nombre y tamaño, y permite cambiarlo', () => {
    const { host } = mount({ file: { name: 'reglamento.docx', size: 31539 } });
    expect(host.textContent).toContain('reglamento.docx');
    expect(host.textContent).toContain('31 KB');
    expect(host.textContent).not.toContain('Arrastra tu archivo aquí');
    const change = [...host.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Cambiar archivo'),
    );
    expect(change).toBeDefined();
  });

  it('mientras lee, lo dice y no deja cambiar el archivo', () => {
    const { host } = mount({ file: { name: 'a.md', size: 10 }, reading: true });
    expect(host.textContent).toContain('Leyendo…');
    const change = [...host.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Cambiar archivo'),
    ) as HTMLButtonElement;
    expect(change.disabled).toBe(true);
  });
});
