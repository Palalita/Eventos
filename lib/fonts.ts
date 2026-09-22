// Registro de combinaciones tipográficas que un cliente puede elegir para
// su evento, independiente de la paleta de color (ver lib/themes.ts).
// Cada una corresponde a una clase `.font-<id>` en app/globals.css que
// redefine --font-heading/--font-script/--font-accent (--font-body se
// queda siempre en Poppins, para que el texto de párrafo sea consistente
// entre organizaciones). Las fuentes en sí se cargan una sola vez en
// app/layout.tsx con next/font/google — acá solo se referencian por su
// variable CSS.
export type FontPair = {
  id: string;
  label: string;
  description: string;
};

export const FONTS: FontPair[] = [
  {
    id: "clasica",
    label: "Clásica",
    description: "Serif elegante con firma en script — el estilo romántico de toda la vida.",
  },
  {
    id: "moderna",
    label: "Moderna",
    description: "Todo en sans-serif, líneas limpias, look minimalista.",
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Serif contemporáneo, elegante sin caer en lo clásico.",
  },
];

export const DEFAULT_FONT = FONTS[0].id;

export function isValidFont(font: string): boolean {
  return FONTS.some((f) => f.id === font);
}
