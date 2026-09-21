// Lee la configuración global del evento (nombre de la quinceañera, fecha,
// lugar...) y qué secciones del sitio están activadas/desactivadas. Ambas
// cosas viven en una sola fila de cada tabla (EventSettings tiene un único
// registro con id "singleton"; SiteSection tiene una fila por sección).
//
// Quién usa esto: `app/page.tsx` (la landing) y `app/invitacion/[token]/page.tsx`
// llaman a getEventSettings() para mostrar fecha/lugar/nombre; `app/page.tsx`
// también llama a getSectionFlags() para decidir qué bloques renderizar.
// `app/actions/settings.ts` es quien las actualiza (desde el panel de admin
// en app/admin/contenido y app/admin/paginas).
import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { SITE_SECTIONS, type SiteSectionKey } from "@/lib/site-sections";

// `cache()` evita repetir la consulta si getEventSettings() se llama varias
// veces durante el mismo request (p. ej. desde la página y desde un layout).
export const getEventSettings = cache(async () => {
  const existing = await db.eventSettings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;

  // Solo se crea si el seed nunca corrió; en operación normal esto no se
  // ejecuta, así que la lectura habitual no hace ninguna escritura.
  return db.eventSettings.create({
    data: {
      id: "singleton",
      quinceaneraNombre: "Mi evento",
      fechaEvento: new Date(),
      lugar: "",
      lema: "",
    },
  });
});

// Devuelve un mapa { claveDeSección: activada/desactivada } para las
// secciones definidas en lib/site-sections.ts.
export const getSectionFlags = cache(async () => {
  const rows = await db.siteSection.findMany();
  const map = new Map(rows.map((row) => [row.key, row.enabled]));
  // Cualquier sección que falte en la BD se trata como habilitada por defecto.
  const flags = {} as Record<SiteSectionKey, boolean>;
  for (const section of SITE_SECTIONS) {
    flags[section.key] = map.get(section.key) ?? true;
  }
  return flags;
});
