// Lista única de las secciones del sitio que el admin puede prender/apagar
// (por ejemplo, para no mostrar "subir fotos del evento" antes de que
// empiece la fiesta). Es la fuente de verdad de los `key`: tienen que
// coincidir con las filas que crea `prisma/seed.mjs` y con los checkboxes de
// `app/admin/paginas/page.tsx`. `lib/settings.ts` (getSectionFlags) la usa
// para saber qué secciones existen y armar el mapa de activadas/desactivadas.
export const SITE_SECTIONS = [
  { key: "invitacion", label: "Invitación e Indicaciones" },
  { key: "save_the_date", label: "Save the Date" },
  { key: "preevento_subir", label: "Fotos y videos preevento (subir)" },
  { key: "preevento_ver", label: "Fotos y videos preevento (ver)" },
  { key: "evento_subir", label: "Fotos y videos del evento (subir)" },
  { key: "evento_ver", label: "Fotos y videos del evento (ver)" },
] as const;

// Tipo union literal ("invitacion" | "save_the_date" | ...) derivado del
// array de arriba, para que TypeScript avise si algún lado usa una clave que
// no existe.
export type SiteSectionKey = (typeof SITE_SECTIONS)[number]["key"];
