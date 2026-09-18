import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { SITE_SECTIONS, type SiteSectionKey } from "@/lib/site-sections";

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
