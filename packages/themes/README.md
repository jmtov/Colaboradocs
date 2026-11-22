# @colaboradocs/themes

Temas: colores, categorías, tokens y fuentes, con **variantes** por evento. El código trae un solo tema genérico (`neutral`, con la variante `solido`); **los temas de cada organización son datos** (JSON), no código.

```ts
import { BUILTIN_THEMES, neutralTheme } from '@colaboradocs/themes';
```

Cada tema define, con valores claro y oscuro (obligatorios): colores (`bg`, `ink`, `accent`, `accentSurface`, `onAccent`; el resto se deriva), hasta 10 colores de categoría, tokens (tamaños de texto, formas, líneas, movimiento, separación entre celdas) y fuentes. Una variante sobrescribe solo lo que cambia. Ver el contrato en `deck-core/src/theme`.

## Temas propios (JSON)

Un tema de organización es una carpeta `<id>/` con `theme.json` (un `Theme`, validado con `validateTheme`) y `fonts/` (los `.woff2`). En Colaboradocs se guardan en la base (tabla `themes`) y se importan por CLI o desde la página.

## Carpetas

- `src/neutral.theme.ts`: el tema genérico.
- `fonts/neutral/`: sus fuentes (Geist, licencia OFL).

## Comandos

```sh
npm test -w @colaboradocs/themes
npm run typecheck -w @colaboradocs/themes
```
