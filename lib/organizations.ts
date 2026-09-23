// Aprovisiona una organización nueva (un evento/cliente de la plataforma):
// la fila de Organization, su EventSettings, y las filas base de
// SiteSection — el mismo trío que antes armaba prisma/seed.mjs a mano para
// el único tenant que existía. Lo usan:
// - app/actions/organizations.ts (createOrganization, al registrarse un
//   cliente nuevo en /crear-cuenta)
// - prisma/seed.mjs (para seguir pudiendo sembrar un tenant de desarrollo)
import "server-only";
import { randomInt } from "node:crypto";
import { db } from "@/lib/db";
import { SITE_SECTIONS } from "@/lib/site-sections";
import { DEFAULT_THEME } from "@/lib/themes";
import { DEFAULT_FONT } from "@/lib/fonts";
import { DEFAULT_LAYOUT } from "@/lib/layouts";

const SLUG_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca tildes/diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function randomSuffix(length = 4) {
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += SLUG_CHARS[randomInt(SLUG_CHARS.length)];
  }
  return suffix;
}

// Prueba "mi-evento", después "mi-evento-a1b2", "mi-evento-c3d4"... hasta
// encontrar uno libre. Con un sufijo random de 4 caracteres alfanuméricos
// (36^4 ≈ 1.7M combinaciones) alcanza de sobra para que una colisión real
// sea prácticamente imposible en un par de intentos.
async function generateUniqueSlug(name: string) {
  const base = slugify(name) || "evento";
  let candidate = base;
  while (await db.organization.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${randomSuffix()}`;
  }
  return candidate;
}

export async function provisionOrganization(input: {
  eventName: string;
  theme?: string;
  font?: string;
  layout?: string;
  // Opcionales: si el cliente ya escribió un mensaje de bienvenida en
  // /crear-cuenta, se guarda de una vez. La foto principal NO entra acá —
  // necesita el id de la organización para su nombre de archivo en Blob
  // (ver createOrganization en app/actions/organizations.ts), así que esa
  // se sube después y se actualiza con un segundo `update`.
  lema?: string;
}) {
  const slug = await generateUniqueSlug(input.eventName);

  const organization = await db.organization.create({
    data: {
      slug,
      name: input.eventName,
      theme: input.theme ?? DEFAULT_THEME,
      font: input.font ?? DEFAULT_FONT,
      layout: input.layout ?? DEFAULT_LAYOUT,
    },
  });

  await db.eventSettings.create({
    data: {
      organizationId: organization.id,
      tituloEvento: input.eventName,
      fechaEvento: new Date(),
      lugar: "",
      lema: input.lema ?? "",
    },
  });

  await db.siteSection.createMany({
    data: SITE_SECTIONS.map((section) => ({
      organizationId: organization.id,
      key: section.key,
      label: section.label,
      enabled: true,
    })),
  });

  return organization;
}
