/** Los cuatro colores del ícono: fondo del lienzo, cara del bloque, tinta de las iniciales, y sombra (que también es el borde de la cara). */
export type IconColors = {
  bg: string;
  face: string;
  ink: string;
  shadow: string;
};

/** La identidad de una instalación (un nodo): cómo se llama en la pantalla de inicio y cómo luce su ícono. */
export type PwaConfig = {
  /** Nombre que sale bajo el ícono y en el instalador. */
  name: string;
  /** Una a tres letras dentro del bloque. */
  initials: string;
  colors: IconColors;
};

/** Lo que el build deja en la página: ruta (sin «/» inicial) → contenido. */
export type PwaAssets = Map<string, string | Uint8Array>;
