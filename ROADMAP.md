# Hoja de ruta

Cómo crece Colaboradocs sin complicarse antes de tiempo. Es del producto, no de un despliegue: lo de cada despliegue va en `docs/` (fuera de git). Cada punto dice **qué dispara hacerlo**; sin disparador, no se hace.

## Principio

Tres niveles de acceso (persona, agente, admin) alcanzan mientras haya un solo perfil que no encaje. Cada permiso nuevo es una decisión de seguridad que hay que mantener, así que se añaden cuando hay un caso real, no «por si acaso». Las reglas viven en un solo lugar (`packages/review-core/src/permissions.utils.ts`) para que cambiarlas después sea barato.

## Hecho

- **Rol «agente»** (migración `0009_agent.sql`): no es admin; lee, crea y asigna tareas (y las asocia a un documento después), guarda borradores y **publica documentos** si el último guardado del borrador fue suyo y sin `force`. No archiva, no gestiona accesos ni publica presentaciones. Ver «Rol agente» en el README.

## Hecho también

- **Manual UTCP** (`GET /api/utcp`, `packages/review-worker/src/utcp/`): tareas, documentos (leer, borrador, publicar) y presentaciones (leer, borrador). Una prueba de contrato lo ejecuta contra el API real.
- **Permisos con nombre** (`review-core/src/permissions.utils.ts`): `PERMISSIONS`, `ROLE_PERMISSIONS` (persona, agente, admin) y una tabla ruta → permiso para `/admin/*`, con negación por omisión; una prueba exige que ninguna ruta real quede sin listar. El manual solo anuncia las herramientas cuyo permiso tiene el agente. Diferencia con lo planeado: las rutas no piden el permiso una a una (`requirePermission`), sino que un solo middleware consulta la tabla, para que una ruta olvidada sea de admins y no de todos.

## Riesgo aceptado

El agente puede reemplazar un documento publicado. Se decidió así para poder delegar. Lo que lo acota: solo publica lo que él guardó por última vez, nunca fuerza, la versión anterior queda en las versiones y no puede archivar. Lo que **no** evita: los comentarios y OK de los párrafos cambiados dejan de aplicar. *Disparador para apretarlo* (p. ej. solo documentos nuevos, o pedir aprobación): un reemplazo que pierda revisión del equipo, o contenido de terceros que el agente lea y le haga publicar algo indebido.

- **Instancias fuera del repo** (`NODE_DIR`): los CLI de PIN, documentos, presentaciones y `setup` leen la configuración, los secretos y los respaldos de una carpeta aparte. Falta el build por nodo y el comando de despliegue a todos; el plan está en el README de `telar`.

## Siguiente

- **Que el manual se genere por completo.** Hoy cada herramienta se escribe a mano y solo se filtra por permiso; el esquema de entradas y la URL siguen a mano y los vigila la prueba de contrato. *Disparador:* más de ~15 herramientas o un segundo manual para otro rol.
- **Borradores de presentaciones con autor y revisión**, como los de documentos. Sin eso el agente solo guarda sobre un deck existente y puede pisar un borrador ajeno, y no se le puede dejar publicar decks. *Disparador:* querer que el agente publique presentaciones.

## Cuando haya un disparador

- **Permisos por persona en la base de datos** (tabla de permisos y pantalla para asignarlos). *Disparador:* un segundo perfil con permisos distintos (un editor humano que guarda borradores pero no publica, o un segundo agente con otro alcance), o dar un permiso suelto sin hacer admin a alguien. El paso es cambiar de dónde salen los conjuntos del punto 1; las rutas no cambian.
- **Crear y ver agentes desde `/accesos`.** Hoy solo por CLI (`pins add --agent`). *Disparador:* más de un agente o quien administre no usa el CLI.
- **Que el agente suba imágenes a un deck** (`PUT /admin/decks/:id/files/*`). Hoy no puede porque escribe directo sobre lo publicado. *Disparador:* decks con imágenes que el agente arma de principio a fin; antes, guardar los archivos junto al borrador.
- **Descartar borradores (`DELETE …/draft`) por el agente.** Hoy no, para no tirar el trabajo de un admin. *Disparador:* borradores que el propio agente crea y quiere rehacer; se limitaría a los suyos.

## Pendientes ya conocidos

- Esquema de presentaciones: iconos, énfasis dentro del texto, bloques fusionables, agenda enlazada. Ver «Pendiente» en [`ESQUEMA.md`](packages/deck-core/ESQUEMA.md).
- Revisar si el README sigue diciendo bien que el nombre del espacio y el rol se editan solo por CLI.

## Antes de desplegar el rol agente

1. `wrangler d1 migrations apply <base> --remote` (migración `0009`) **antes** del deploy.
2. `npm run pins -- add "Claude" --agent --remote` y guardar el PIN fuera del repo.
