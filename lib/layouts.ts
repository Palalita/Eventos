// Registro de estructuras de portada que un cliente puede elegir para su
// evento, independiente de la paleta de color (lib/themes.ts) y la
// tipografía (lib/fonts.ts). Cada una corresponde a una rama de GuestHero
// en app/panel/page.tsx (la clase base sigue siendo .guest-hero, con un
// modificador .guest-hero--<id> cuando el layout no es el clásico) — el
// color/tipografía elegidos se le aplican igual, vía las mismas variables
// --rose/--gold/--font-heading/etc, así que cualquier layout combina con
// cualquier tema.
export type Layout = {
  id: string;
  label: string;
  description: string;
};

export const LAYOUTS: Layout[] = [
  {
    id: "clasico",
    label: "Clásico",
    description: "Foto enmarcada, todo centrado — el estilo romántico de siempre.",
  },
  {
    id: "cinematica",
    label: "Cinemática",
    description: "Foto de fondo a pantalla completa con el texto superpuesto.",
  },
];

export const DEFAULT_LAYOUT = LAYOUTS[0].id;

export function isValidLayout(layout: string): boolean {
  return LAYOUTS.some((l) => l.id === layout);
}
