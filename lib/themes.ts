// Registro de temas visuales que un cliente puede elegir para su evento
// (Organization.theme guarda uno de estos ids). Cada uno corresponde a una
// clase `.theme-<id>` en app/globals.css que redefine las variables de
// color (--rose, --rose-dark, --rose-light, --gold, --cream,
// --gradient-mid); ver ese archivo para los valores reales y
// app/layout.tsx, que decide qué clase poner en <html> según la
// organización de la sesión actual.
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
    label: "XV años · Rosa y dorado",
    description: "El clásico romántico: rosa, dorado y tipografías en script.",
    preview: ["#d86c7d", "#8d2536", "#bda672"],
  },
  {
    id: "boda_salvia",
    label: "Boda · Verde salvia",
    description: "Elegante y natural: verde salvia, champán y blanco marfil.",
    preview: ["#7d9678", "#445940", "#c2a878"],
  },
];

export const DEFAULT_THEME = THEMES[0].id;

export function isValidTheme(theme: string): boolean {
  return THEMES.some((t) => t.id === theme);
}
