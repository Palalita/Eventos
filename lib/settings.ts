// Lee la configuración de un evento (título, fecha, lugar...) y qué
// secciones del sitio están activadas/desactivadas — ambas cosas ahora por
// organización (EventSettings es 1:1 con Organization; SiteSection tiene
// una fila por sección y organización).
//
// Quién usa esto: `app/page.tsx` (la landing) y `app/invitacion/[token]/page.tsx`
// llaman a getEventSettings(organizationId) para mostrar fecha/lugar/título;
// `app/page.tsx` también llama a getSectionFlags(organizationId) para decidir
// qué bloques renderizar. `app/actions/settings.ts` es quien las actualiza
// (desde el panel de admin en app/admin/contenido y app/admin/paginas).
import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { SITE_SECTIONS, type SiteSectionKey } from "@/lib/site-sections";

// `cache()` evita repetir la consulta si getEventSettings() se llama varias
// veces durante el mismo request (p. ej. desde la página y desde un layout).
// Nota: cache() de React memoiza por argumentos, así que dos organizaciones
// distintas en el mismo request (no pasa hoy, pero por las dudas) no se
// pisan entre sí.
export const getEventSettings = cache(async (organizationId: string) => {
  const existing = await db.eventSettings.findUnique({ where: { organizationId } });
  if (existing) return existing;

  // Solo se crea si provisionOrganization() nunca corrió para esta
  // organización; en operación normal esto no se ejecuta, así que la
  // lectura habitual no hace ninguna escritura.
  return db.eventSettings.create({
    data: {
      organizationId,
      tituloEvento: "Mi evento",
      fechaEvento: new Date(),
      lugar: "",
      lema: "",
    },
  });
});

// Devuelve un mapa { claveDeSección: activada/desactivada } para las
// secciones definidas en lib/site-sections.ts, dentro de una organización.
export const getSectionFlags = cache(async (organizationId: string) => {
  const rows = await db.siteSection.findMany({ where: { organizationId } });
  const map = new Map(rows.map((row) => [row.key, row.enabled]));
  // Cualquier sección que falte en la BD se trata como habilitada por defecto.
  const flags = {} as Record<SiteSectionKey, boolean>;
  for (const section of SITE_SECTIONS) {
    flags[section.key] = map.get(section.key) ?? true;
  }
  return flags;
});
