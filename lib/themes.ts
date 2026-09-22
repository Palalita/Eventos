// Registro de paletas de color que un cliente puede elegir para su evento
// (Organization.theme guarda uno de estos ids). Cada una corresponde a una
// clase `.theme-<id>` en app/globals.css que redefine las variables de
// color (--rose, --rose-dark, --rose-light, --gold, --cream,
// --gradient-mid); ver ese archivo para los valores reales y
// app/layout.tsx, que decide qué clase poner en <html> según la
// organización de la sesión actual.
//
// La tipografía es una elección aparte (ver lib/fonts.ts) — estas
// descripciones hablan solo de color a propósito, cualquier paleta se
// puede combinar con cualquier tipografía.
//
// `preview` es una franja de 3 colores para mostrar en el selector de
// /crear-cuenta, sin tener que duplicar los valores del CSS ahí — si se
// agrega un tema acá, agregar también su clase .theme-<id> en globals.css.
export type Theme = {
  id: string;
  label: string;
  description: string;
  preview: [string, string, string];
};

export const THEMES: Theme[] = [
  {
    id: "xv_rosa_dorado",
    label: "Rosa y dorado",
    description: "Un clásico romántico: rosa suave y dorado cálido.",
    preview: ["#d86c7d", "#8d2536", "#bda672"],
  },
  {
    id: "boda_salvia",
    label: "Verde salvia",
    description: "Natural y elegante: verde salvia, champán y blanco marfil.",
    preview: ["#7d9678", "#445940", "#c2a878"],
  },
  {
    id: "bautizo_celeste",
    label: "Celeste y blanco",
    description: "Suave y luminoso: celeste con toques champán.",
    preview: ["#6fa8c9", "#2d5f7c", "#c9b98a"],
  },
  {
    id: "comunion_lavanda",
    label: "Lavanda y perla",
    description: "Delicado y sereno: lavanda con dorado suave.",
    preview: ["#a496c4", "#5c4b82", "#cbbf9a"],
  },
  {
    id: "baby_shower_durazno",
    label: "Durazno y menta",
    description: "Tierno y cálido: durazno y menta.",
    preview: ["#e8a87c", "#b3652f", "#8fb9a8"],
  },
  {
    id: "cumpleanos_coral",
    label: "Coral y turquesa",
    description: "Alegre y festivo: coral y turquesa.",
    preview: ["#ef6f61", "#a83b2f", "#3fa9a0"],
  },
  {
    id: "graduacion_marino",
    label: "Azul marino y dorado",
    description: "Formal y distinguido: azul marino y dorado.",
    preview: ["#2d4a73", "#16263d", "#c9a227"],
  },
  {
    id: "corporativo_acero",
    label: "Gris y azul acero",
    description: "Sobrio y profesional: gris acero y azul apagado.",
    preview: ["#4c6b82", "#263849", "#8a8f94"],
  },
  {
    id: "convivio_terracota",
    label: "Terracota y oliva",
    description: "Cálido y cercano: terracota y oliva.",
    preview: ["#c17a4f", "#7a4527", "#8a9a5b"],
  },
];

export const DEFAULT_THEME = THEMES[0].id;

export function isValidTheme(theme: string): boolean {
  return THEMES.some((t) => t.id === theme);
}
