import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { idFromFileName, parseUpload, type UploadFile } from './parse.utils';

function file(name: string, content: string | Buffer): UploadFile {
  const buffer = typeof content === 'string' ? Buffer.from(content) : content;
  return {
    name,
    text: async () => buffer.toString('utf8'),
    arrayBuffer: async () =>
      buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer,
  };
}

const docx = readFileSync(
  fileURLToPath(new URL('./fixtures/reglamento.docx', import.meta.url)),
);

describe('idFromFileName', () => {
  it('saca un id válido del nombre del archivo', () => {
    expect(idFromFileName('Mi Reglamento 2026.docx')).toBe(
      'mi-reglamento-2026',
    );
    expect(idFromFileName('Ñandú: versión final!.md')).toBe(
      'nandu-version-final',
    );
  });
});

describe('parseUpload', () => {
  it('lee un .md y devuelve un documento ya validado', async () => {
    const result = await parseUpload(
      file('Mi doc.md', '# Mi doc\n\n## Uno\n\nHola <script>x</script>\n'),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.kind).toBe('markdown');
      expect(result.document.id).toBe('mi-doc');
      expect(result.document.sections[0]?.html).toBe('<p>Hola </p>');
    }
  });

  it('lee un .docx desde un arrayBuffer, como en el navegador', async () => {
    const result = await parseUpload(file('reglamento.docx', docx));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.kind).toBe('docx');
      expect(result.document.sections.map((s) => s.title)).toEqual([
        'Introducción',
        'Decisiones',
      ]);
      expect(result.warnings.join(' ')).toContain('tablas');
    }
  });

  it('acepta un .json completo y lo valida', async () => {
    const json = JSON.stringify({
      id: 'x',
      title: 'X',
      version: '1',
      updated: '2026-01-01',
      sources: [],
      sections: [
        { id: 's', num: '1', title: 'S', status: 'listo', html: '<p>a</p>' },
      ],
    });
    const ok = await parseUpload(file('x.json', json));
    expect(ok.ok && ok.kind).toBe('json');
    const bad = await parseUpload(file('x.json', '{"id":"x"}'));
    expect(bad.ok).toBe(false);
  });

  it('el id y el título pueden venir de fuera', async () => {
    const result = await parseUpload(file('a.md', '## Uno\n\nhola'), {
      id: 'otro',
      title: 'Mi título',
    });
    expect(result.ok && result.document.id).toBe('otro');
    expect(result.ok && result.document.title).toBe('Mi título');
  });

  it('avisa si el formato no sirve o el archivo está dañado', async () => {
    const pdf = await parseUpload(file('a.pdf', 'x'));
    expect(!pdf.ok && pdf.errors.join(' ')).toContain('Formato no soportado');
    const broken = await parseUpload(file('a.json', '{no es json'));
    expect(!broken.ok && broken.errors.join(' ')).toContain('No pude leer');
    const empty = await parseUpload(file('a.md', 'solo texto sin secciones'));
    expect(empty.ok).toBe(false);
  });
});
