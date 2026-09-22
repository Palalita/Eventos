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
  {
    id: "bautizo_celeste",
    label: "Bautizo · Celeste y blanco",
    description: "Suave y luminoso: celeste, blanco y toques champán.",
    preview: ["#6fa8c9", "#2d5f7c", "#c9b98a"],
  },
  {
    id: "comunion_lavanda",
    label: "Primera comunión · Lavanda y perla",
    description: "Delicado y sereno: lavanda, perla y dorado suave.",
    preview: ["#a496c4", "#5c4b82", "#cbbf9a"],
  },
  {
    id: "baby_shower_durazno",
    label: "Baby shower · Durazno y menta",
    description: "Tierno y cálido: durazno, menta y crema.",
    preview: ["#e8a87c", "#b3652f", "#8fb9a8"],
  },
  {
    id: "cumpleanos_coral",
    label: "Cumpleaños · Coral y turquesa",
    description: "Alegre y festivo: coral, turquesa y blanco.",
    preview: ["#ef6f61", "#a83b2f", "#3fa9a0"],
  },
  {
    id: "graduacion_marino",
    label: "Graduación · Azul marino y dorado",
    description: "Formal y distinguido: azul marino y dorado académico.",
    preview: ["#2d4a73", "#16263d", "#c9a227"],
  },
  {
    id: "aniversario_vino",
    label: "Aniversario · Vino y champán",
    description: "Elegante y cálido: vino, champán y dorado suave.",
    preview: ["#7a2e3d", "#4a1620", "#cdb079"],
  },
  {
    id: "compromiso_blush",
    label: "Compromiso · Blush y champán",
    description: "Romántico y sutil: blush, champán y marfil.",
    preview: ["#dba0a8", "#96525b", "#c9ae7c"],
  },
  {
    id: "corporativo_acero",
    label: "Evento corporativo · Gris y azul acero",
    description: "Sobrio y profesional: gris acero y azul apagado.",
    preview: ["#4c6b82", "#263849", "#8a8f94"],
  },
  {
    id: "convivio_terracota",
    label: "Convivio · Terracota y oliva",
    description: "Cálido y cercano: terracota, oliva y crema.",
    preview: ["#c17a4f", "#7a4527", "#8a9a5b"],
  },
];

export const DEFAULT_THEME = THEMES[0].id;

export function isValidTheme(theme: string): boolean {
  return THEMES.some((t) => t.id === theme);
}
