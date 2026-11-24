# Hoja de ruta

Cómo crece Colaboradocs sin complicarse antes de tiempo. Es del producto, no de un despliegue: lo de cada despliegue va en `docs/` (fuera de git). Cada punto dice **qué dispara hacerlo**; sin disparador, no se hace.

## Principio

Tres niveles de acceso (persona, agente, admin) alcanzan mientras haya un solo perfil que no encaje. Cada permiso nuevo es una decisión de seguridad que hay que mantener, así que se añaden cuando hay un caso real, no «por si acaso». Las reglas viven en un solo lugar (`packages/review-core/src/permissions.utils.ts`) para que cambiarlas después sea barato.

## Hecho

- **Rol «agente»** (migración `0009_agent.sql`): no es admin; lee, crea y asigna tareas (y las asocia a un documento después), guarda borradores y **publica documentos** si el último guardado del borrador fue suyo y sin `force`. No archiva, no gestiona accesos ni publica presentaciones. Ver «Rol agente» en el README.

## Hecho también

- **Manual UTCP** (`GET /api/utcp`, `packages/review-worker/src/utcp/`): tareas, lectura de documentos y borradores de documentos. Una prueba de contrato lo ejecuta contra el API real. Falta que se **genere** desde la tabla de permisos (punto 2 de abajo) y sumar las presentaciones.

## Riesgo aceptado

El agente puede reemplazar un documento publicado. Se decidió así para poder delegar. Lo que lo acota: solo publica lo que él guardó por última vez, nunca fuerza, la versión anterior queda en las versiones y no puede archivar. Lo que **no** evita: los comentarios y OK de los párrafos cambiados dejan de aplicar. *Disparador para apretarlo* (p. ej. solo documentos nuevos, o pedir aprobación): un reemplazo que pierda revisión del equipo, o contenido de terceros que el agente lea y le haga publicar algo indebido.

## Siguiente (van juntos)

1. **Permisos con nombre, en código.** Acciones como `documents:read`, `documents:draft`, `documents:publish`, `documents:archive`, `tasks:assign`, `access:manage`. Cada nivel (persona, agente, admin) mapea a un conjunto de permisos en `permissions.utils.ts`; las rutas piden un permiso (`requirePermission(...)`) en vez de preguntar por el nivel. Sin migración. Las reglas que dependen del recurso («borra su autor o un admin», «marca la tarea quien la tiene») siguen como están: no son permisos puros.
2. **Manual UTCP del API** (`GET /api/utcp`), para que un agente descubra y llame las herramientas. Se **genera desde la tabla de permisos**, así que no se desincroniza y solo anuncia lo que el rol puede hacer. Alcance inicial: leer documentos y presentaciones, crear y consultar tareas, guardar borradores. La auth sigue siendo PIN → token (30 días); el agente es una persona más, con su PIN.

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
