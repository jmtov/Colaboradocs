# Genera los SVG de esta carpeta: python3 diagramas/generar.py
# Estilo: sin sombras, flechas ortogonales, un acento, leyenda abajo (basado en cathrynlavery/diagram-design).
import html, sys
import os
OUT = os.path.dirname(os.path.abspath(__file__)) + '/'
E = html.escape

CSS = """
.paper{fill:#f5f5f5}.title{font:400 26px Georgia,'Times New Roman',serif;fill:#2d3142}
.eyebrow{font:500 10px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.12em;fill:#5a6580}
.name{font:600 14px system-ui,-apple-system,'Segoe UI',sans-serif;fill:#2d3142}
.sub{font:400 11px ui-monospace,Menlo,Consolas,monospace;fill:#4f5d75}
.lbl{font:500 10px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.06em;fill:#4f5d75}
.note{font:italic 400 14px Georgia,'Times New Roman',serif;fill:#4f5d75}
.mask{fill:#f5f5f5}
.n-ext{fill:rgba(45,49,66,.03);stroke:rgba(45,49,66,.45);stroke-width:1}
.n-back{fill:#fff;stroke:#2d3142;stroke-width:1}
.n-store{fill:rgba(45,49,66,.06);stroke:#4f5d75;stroke-width:1}
.n-focal{fill:rgba(191,69,32,.08);stroke:#bf4520;stroke-width:1.2}
.n-scope{fill:none;stroke:#5a6580;stroke-width:1;stroke-dasharray:4 3}
.e{fill:none;stroke:#4f5d75;stroke-width:1}.e-link{fill:none;stroke:#2e5aa8;stroke-width:1}
.e-acc{fill:none;stroke:#bf4520;stroke-width:1.2}.dash{stroke-dasharray:5 4}
.life{stroke:#bfc0c0;stroke-width:1;stroke-dasharray:3 4}.rule{stroke:rgba(45,49,66,.15);stroke-width:1}
.mk{fill:#4f5d75}.mk-link{fill:#2e5aa8}.mk-acc{fill:#bf4520}
@media (prefers-color-scheme:dark){
.paper{fill:#2d3142}.title,.name{fill:#f5f5f5}.eyebrow,.sub,.lbl,.note{fill:#bfc0c0}.mask{fill:#2d3142}
.n-ext{fill:rgba(245,245,245,.04);stroke:rgba(245,245,245,.4)}.n-back{fill:#393e53;stroke:#f5f5f5}
.n-store{fill:rgba(245,245,245,.07);stroke:#bfc0c0}.n-focal{fill:rgba(240,138,89,.12);stroke:#f08a59}
.n-scope{stroke:#949eb2}.e{stroke:#bfc0c0}.e-link{stroke:#739fdf}.e-acc{stroke:#f08a59}
.life{stroke:rgba(191,192,192,.3)}.rule{stroke:rgba(245,245,245,.15)}
.mk{fill:#bfc0c0}.mk-link{fill:#739fdf}.mk-acc{fill:#f08a59}}
"""
class D:
    def __init__(s, slug, eyebrow, title, desc, w, h):
        s.slug, s.eyebrow, s.title, s.desc, s.w, s.h = slug, eyebrow, title, desc, w, h
        s.back, s.edges, s.labels, s.nodes, s.extra, s.kinds = [], [], [], [], [], []
    def scope(s, x, y, w, h, text):
        s.back.append(f'<rect class="n-scope" x="{x}" y="{y}" width="{w}" height="{h}" rx="8"/><text class="eyebrow" x="{x+16}" y="{y+20}">{E(text)}</text>')
        s.use('scope')
    def use(s, k):
        if k not in s.kinds: s.kinds.append(k)
    def node(s, x, y, w, h, name, sub, kind='back'):
        s.use(kind)
        assert len(name)*8.4 <= w-24, ('name', name)
        for l in sub: assert len(l)*7.0 <= w-20, ('sub', l, w)
        n = len(sub); th = 18 + 14*n
        y0 = y + (h-th)/2 + 14
        t = f'<text class="name" x="{x+14}" y="{y0:.0f}">{E(name)}</text>'
        for i, l in enumerate(sub):
            t += f'<text class="sub" x="{x+14}" y="{y0+18+14*i:.0f}">{E(l)}</text>'
        s.nodes.append(f'<rect class="n-{kind}" x="{x}" y="{y}" width="{w}" height="{h}" rx="6"/>{t}')
    def edge(s, pts, kind='', dashed=False, start=False):
        r = 8; cls = {'': 'e', 'link': 'e-link', 'acc': 'e-acc'}[kind]; mk = {'': 'mk', 'link': 'mk-link', 'acc': 'mk-acc'}[kind]
        d = f'M{pts[0][0]} {pts[0][1]}'
        for i in range(1, len(pts)):
            (x0, y0), (x1, y1) = pts[i-1], pts[i]
            if i < len(pts)-1:
                x2, y2 = pts[i+1]
                def u(a, b):
                    l = abs(b[0]-a[0])+abs(b[1]-a[1]); return ((b[0]-a[0])/l, (b[1]-a[1])/l)
                ux, uy = u((x0, y0), (x1, y1)); vx, vy = u((x1, y1), (x2, y2))
                d += f' L{x1-ux*r:g} {y1-uy*r:g} Q{x1} {y1} {x1+vx*r:g} {y1+vy*r:g}'
            else: d += f' L{x1} {y1}'
        s.edges.append(f'<path class="{cls}{" dash" if dashed else ""}" d="{d}" marker-end="url(#{mk})"/>')
    def label(s, x, y, text, anchor='middle'):
        w = len(text)*6.6+10
        rx = x-w/2 if anchor == 'middle' else x-4
        s.labels.append(f'<rect class="mask" x="{rx:.0f}" y="{y-11}" width="{w:.0f}" height="16"/><text class="lbl" x="{x if anchor=="middle" else x+1}" y="{y}" text-anchor="{"middle" if anchor=="middle" else "start"}">{E(text)}</text>')
    def text(s, x, y, t, cls='note'): s.extra.append(f'<text class="{cls}" x="{x}" y="{y}">{E(t)}</text>')
    def raw(s, t): s.extra.append(t)
    def legend(s):
        names = {'ext': 'EXTERNO / CLIENTE', 'back': 'COMPONENTE', 'store': 'ALMACÉN (D1)', 'focal': 'FOCO', 'scope': 'ÁMBITO'}
        out, x, y = '', 40, s.h-36
        for k in s.kinds:
            if k in s.legend_names: nm = s.legend_names[k]
            else: nm = names[k]
            out += f'<rect class="n-{k}" x="{x}" y="{y}" width="20" height="12" rx="3"/><text class="lbl" x="{x+28}" y="{y+10}">{E(nm)}</text>'
            x += 28 + len(nm)*6.6 + 28
        return out
    legend_names = {}
    def write(s):
        defs = ''.join(f'<marker id="{s.slug}-{m}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path class="{m}" d="M0 1L10 5L0 9z"/></marker>' for m in ('mk', 'mk-link', 'mk-acc'))
        body = ''.join(s.back)+''.join(s.edges)+''.join(s.labels)+''.join(s.nodes)+''.join(s.extra)
        body = body.replace('url(#mk', f'url(#{s.slug}-mk')
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {s.w} {s.h+24}" role="img" aria-labelledby="{s.slug}-title {s.slug}-desc">
<title id="{s.slug}-title">{E(s.title)}</title><desc id="{s.slug}-desc">{E(s.desc)}</desc>
<style>{CSS}</style><defs>{defs}</defs>
<rect class="paper" width="{s.w}" height="{s.h+24}"/>
<text class="eyebrow" x="40" y="30">{E(s.eyebrow)}</text><text class="title" x="40" y="62">{E(s.title)}</text>
<g transform="translate(0,24)">{body}
<line class="rule" x1="40" x2="{s.w-40}" y1="{s.h-52}" y2="{s.h-52}"/>{s.legend()}</g>
</svg>'''
        open(OUT+s.slug+'.svg', 'w').write(svg)

# 1 arquitectura
d = D('arquitectura', 'COLABORADOCS · ARQUITECTURA', 'Un Worker, una base, una página', 'La página y la API viven en un solo Cloudflare Worker con D1; el CLI escribe en la misma base.', 960, 600)
d.scope(280, 112, 440, 268, 'UN SOLO WORKER · UN SOLO DEPLOY')
d.edge([(130, 216+20), (130, 188), (312, 188)]); d.label(221, 182, 'GET /')
d.edge([(220, 284), (312, 284)]); d.label(266, 274, 'TOKEN')
d.edge([(480, 292), (520, 292)])
d.edge([(688, 292), (776, 292)]); d.label(748, 282, 'SQL')
d.edge([(220, 460), (848, 460), (848, 336)], dashed=True); d.label(534, 454, 'WRANGLER D1')
d.node(40, 236, 180, 88, 'Navegador', ['SPA Solid (apps/web)', 'token en localStorage'], 'ext')
d.node(312, 160, 376, 56, 'Assets estáticos', ['apps/web/dist: la página, sin datos'], 'back')
d.node(312, 248, 168, 88, 'Auth', ['Bearer firmado', 'y D1 en cada petición'], 'back')
d.node(520, 248, 168, 88, 'API · Hono', ['/api/*  login', 'documentos · admin', 'decks · tareas'], 'focal')
d.node(776, 248, 144, 88, 'D1', ['todo el estado:', 'docs, decks, PIN'], 'store')
d.node(40, 424, 180, 72, 'CLI', ['pins · documents', 'decks · setup'], 'ext')
d.text(40, 530-6, 'La página no trae documentos: los pide a la API después del PIN.')
d.write()

# 2 paquetes
d = D('paquetes', 'COLABORADOCS · PAQUETES', 'Qué depende de qué', 'Monorepo: la app web usa paquetes de UI, importación y render; todos descansan en un núcleo de TypeScript puro.', 960, 580)
d.edge([(140, 136), (140, 200)]); d.edge([(364, 136), (364, 200)]); d.edge([(588, 136), (588, 200)])
d.edge([(816, 136), (816, 200)], 'link', True); d.label(826, 172, 'HTTP /API', 'start')
for x in (140, 364, 588, 816): d.edge([(x, 288), (x, 344)])
d.scope(40, 344, 880, 132, 'NÚCLEO · SIN DOM NI CLOUDFLARE')
d.node(40, 72, 880, 64, 'apps/web', ['Vite + Solid: home, documentos, editores, presentaciones, tareas, accesos'], 'focal')
d.node(40, 200, 200, 88, 'review-ui', ['Componentes Solid:', 'PIN, hilos, OK,', 'accesos'], 'back')
d.node(264, 200, 200, 88, 'doc-import', ['Word · Markdown · JSON', '→ documento válido'], 'back')
d.node(488, 200, 200, 88, 'deck-render', ['deck + tema →', 'HTML autocontenido'], 'back')
d.node(712, 200, 208, 88, 'review-worker', ['API Hono + D1 + CLI', 'sirve también la página'], 'back')
d.node(56, 380, 400, 76, 'review-core', ['tipos del API y del documento, validación,', 'ids de bloque, hilos, OK, PIN'], 'back')
d.node(480, 380, 200, 76, 'deck-core', ['esquema y validación', 'de decks y temas'], 'back')
d.node(704, 380, 200, 76, 'themes', ['tema neutro; los de', 'cada org son JSON'], 'back')
d.text(40, 508, 'Cada flecha continua es «depende de». La punteada es la única que cruza la red.')
d.write()

# 3 documento
d = D('documento', 'COLABORADOCS · DOCUMENTOS', 'Del archivo a la revisión', 'Un documento entra por archivo o editor, pasa por borrador y se publica; luego el equipo comenta, da OK y asigna tareas.', 960, 620)
d.edge([(220, 108), (280, 108)]); d.edge([(460, 108), (520, 108)]); d.edge([(220, 204), (520, 204)]); d.label(370, 198, 'AUTOGUARDA')
d.edge([(700, 108), (760, 108)]); d.label(730, 98, 'VALIDA')
d.edge([(840, 144), (840, 300)], 'acc'); d.label(850, 226, 'NUEVA VERSIÓN', 'start')
d.edge([(840, 388), (840, 452)], dashed=True); d.label(850, 424, 'REEMPLAZA', 'start')
d.edge([(760, 344), (700, 344)]); d.edge([(520, 344), (460, 344)])
d.node(40, 72, 180, 72, 'Archivo', ['Word, Markdown o JSON'], 'ext')
d.node(40, 168, 180, 72, 'Editor web', ['/d/<id>/editar'], 'ext')
d.node(280, 72, 180, 72, 'doc-import', ['convierte y avisa de', 'lo que no se conservó'], 'back')
d.node(520, 72, 180, 168, 'Borrador', ['uno por documento,', 'compartido por admins', 'con revisión: nadie', 'pisa a otro'], 'back')
d.node(760, 72, 160, 72, 'Publicar', ['solo admins'], 'focal')
d.node(760, 300, 160, 88, 'Vigente', ['/d/<id> en D1', 'texto tras el PIN'], 'store')
d.node(760, 452, 160, 72, 'Versiones', ['quién y cuándo', 'la reemplazó'], 'store')
d.node(520, 300, 180, 88, 'Revisión', ['comentarios e hilos', 'OK por bloque'], 'focal')
d.node(280, 300, 180, 88, 'Tareas', ['una persona, una fecha', 'puede colgar de bloque'], 'back')
d.text(40, 452, 'El id de un bloque es sección + hash de su texto: si editas un párrafo,')
d.text(40, 474, 'sus comentarios y OK dejan de aplicar. Es a propósito.')
d.write()

# 4 acceso
d = D('acceso', 'COLABORADOCS · ACCESO', 'Del PIN al token', 'Un admin crea el PIN; la persona lo canjea por un token de 30 días y cada petición se verifica en D1.', 960, 640)
X = {'a': 240, 'p': 440, 'w': 660, 'd': 860}
for k, (nm, sb, kd) in {'a': ('Admin', ['CLI o web'], 'ext'), 'p': ('Persona', ['celular'], 'ext'), 'w': ('Worker', ['API'], 'focal'), 'd': ('D1', [], 'store')}.items():
    d.back.append(f'<line class="life" x1="{X[k]}" x2="{X[k]}" y1="136" y2="540"/>')
    d.node(X[k]-70, 80, 140, 56, nm, sb, kd)
def msg(a, b, y, text, kind='', dashed=False):
    d.edge([(X[a]+(0 if X[a] < X[b] else 0), y), (X[b], y)], kind, dashed); d.label((X[a]+X[b])//2, y-8, text)
for y, t in ((176, 'ALTA'), (336, 'LOGIN'), (476, 'CADA PETICIÓN')):
    d.text(40, y+4, t, 'eyebrow')
d.raw('<line class="rule" x1="40" x2="920" y1="296" y2="296"/><line class="rule" x1="40" x2="920" y1="436" y2="436"/>')
msg('a', 'w', 176, 'CREA PERSONA'); msg('w', 'd', 216, 'GUARDA HMAC'); msg('w', 'a', 264, 'PIN (UNA VEZ)', dashed=True)
msg('p', 'w', 336, 'PIN + DEVICE'); msg('w', 'd', 376, 'HASH · CUPO · IP'); msg('w', 'p', 416, 'TOKEN 30 DÍAS', dashed=True)
msg('p', 'w', 476, 'BEARER TOKEN', 'link'); msg('w', 'd', 516, '¿SIGUE ACTIVO?')
d.text(40, 574, 'Máx. 2 dispositivos por PIN y 10 fallos por IP cada 15 min. Barrera suave, no seguridad real.')
d.write()

# 5 presentaciones
d = D('presentaciones', 'COLABORADOCS · PRESENTACIONES', 'Una presentación son datos', 'Un deck JSON y un tema JSON se validan y se dibujan en un HTML autocontenido; el editor trabaja sobre un borrador.', 960, 640)
d.edge([(220, 108), (280, 108)]); d.label(250, 98, 'GUARDA')
d.edge([(460, 108), (520, 108)]); d.label(490, 98, 'PUBLICA')
d.edge([(700, 108), (760, 108)], dashed=True); d.label(730, 98, 'COMENTAN')
d.edge([(610, 144), (610, 272)], 'acc'); d.label(620, 214, 'DATOS', 'start')
d.edge([(460, 308), (520, 308)]); d.edge([(700, 308), (760, 308)])
d.edge([(610, 380), (610, 440)], dashed=True); d.label(620, 416, 'RUTA RELATIVA', 'start')
d.node(40, 72, 180, 72, 'Editor web', ['/p/<id>/editar', 'vista previa en vivo'], 'ext')
d.node(280, 72, 180, 72, 'Borrador', ['borrador a medias;', 'se valida al publicar'], 'back')
d.node(520, 72, 180, 72, 'Deck publicado', ['JSON + versiones'], 'store')
d.node(760, 72, 160, 72, 'Revisión', ['mismos hilos y', 'OK que un doc'], 'back')
d.node(280, 272, 180, 72, 'Tema', ['claro + oscuro,', 'categorías, fuentes'], 'store')
d.node(520, 272, 180, 108, 'deck-render', ['valida y dibuja:', 'renderDeck(deck, tema)'], 'focal')
d.node(760, 272, 160, 72, 'HTML', ['/p/<id>: teclas,', 'táctil, PDF'], 'ext')
d.node(520, 440, 180, 72, 'Archivos', ['imágenes assets/…'], 'store')
d.text(40, 404, 'Los temas de cada organización son datos en la base, no código.')
d.text(40, 428, 'Un deck es una cuadrícula de hasta 4×4 con bloques (ver ESQUEMA.md).')
d.write()

# 6 datos
d = D('datos', 'COLABORADOCS · DATOS', 'Qué guarda D1', 'Siete grupos de tablas: accesos, documentos, revisión, tareas, presentaciones, temas y ajustes del espacio.', 960, 620)
d.edge([(360, 120), (260, 120)]); d.label(310, 110, 'AUTOR · OK')
d.edge([(580, 120), (680, 120)]); d.label(630, 110, 'DOCUMENT_ID')
d.edge([(150, 280), (150, 168)]); d.label(160, 230, 'ASIGNADA A', 'start')
d.edge([(470, 168), (470, 280)], dashed=True); d.label(480, 230, "'deck:<ID>'", 'start')
d.edge([(580, 316), (680, 316)]); d.label(630, 306, 'THEME_ID')
d.node(40, 72, 220, 96, 'Accesos', ['reviewers', 'devices', 'login_failures'], 'store')
d.node(360, 72, 220, 96, 'Revisión', ['comments (borrado suave)', 'approvals'], 'focal')
d.node(680, 72, 220, 96, 'Documentos', ['documents', 'document_versions', 'document_drafts'], 'store')
d.node(40, 280, 220, 72, 'Tareas', ['tasks (fecha, bloque)'], 'store')
d.node(360, 280, 220, 96, 'Presentaciones', ['decks (+ borrador)', 'deck_versions', 'deck_files'], 'store')
d.node(680, 280, 220, 72, 'Temas', ['themes', 'theme_files (fuentes)'], 'store')
d.node(40, 440, 220, 72, 'Espacio', ['settings: nombre, rol'], 'store')
d.text(360, 440, 'Sin claves foráneas hacia bloques: cambian con cada versión.')
d.text(360, 464, 'El PIN no se guarda: solo su HMAC con TOKEN_SECRET.')
d.write()
