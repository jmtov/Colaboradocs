# Tipografía de los íconos

`GeistMono-Bold.ttf` dibuja las iniciales de los íconos de la PWA (`../icon.utils.ts`). Es Geist Mono 700, de Vercel, con licencia SIL Open Font License 1.1 (permite usarla y redistribuirla con la app). Salió del paquete `@expo-google-fonts/geist-mono` 0.4.3.

Se incluye en el repo (y no como dependencia) porque el generador de PNG (`@resvg/resvg-js`) necesita un archivo TTF y el paquete original trae ~10 MB de variantes que no se usan.
