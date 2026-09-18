export const SITE_SECTIONS = [
  { key: "invitacion", label: "Invitación e Indicaciones" },
  { key: "save_the_date", label: "Save the Date" },
  { key: "preevento_subir", label: "Fotos y videos preevento (subir)" },
  { key: "preevento_ver", label: "Fotos y videos preevento (ver)" },
  { key: "evento_subir", label: "Fotos y videos del evento (subir)" },
  { key: "evento_ver", label: "Fotos y videos del evento (ver)" },
] as const;

export type SiteSectionKey = (typeof SITE_SECTIONS)[number]["key"];
