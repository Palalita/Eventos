// Script que se corre a mano (`npm run seed`) para dejar la base de datos
// lista con UNA organización de desarrollo: su Organization, sus filas base
// de SiteSection/EventSettings, y opcionalmente su admin inicial. No corre
// solo — hay que ejecutarlo manualmente cada vez que hace falta. En
// producción las organizaciones se crean vía /crear-cuenta
// (lib/organizations.ts#provisionOrganization), no con este script.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const ORG_SLUG = process.env.SEED_ORG_SLUG || "valentina-xv";
const ORG_NAME = process.env.SEED_ORG_NAME || "Valentina";
// MASTER es la cuenta de la empresa (ve/administra todas las
// organizaciones desde /master) — no hay forma de crearla desde ningún
// formulario público a propósito, así que se siembra a mano acá, igual
// que el admin de arriba: definí estas dos en tu .env y corré `npm run
// seed` una vez, con TU propio correo y una contraseña fuerte.
const MASTER_EMAIL = process.env.SEED_MASTER_EMAIL;
const MASTER_PASSWORD = process.env.SEED_MASTER_PASSWORD;

// Debe coincidir con lib/site-sections.ts
const SITE_SECTIONS = [
  { key: "invitacion", label: "Invitación e Indicaciones" },
  { key: "save_the_date", label: "Save the Date" },
  { key: "preevento_subir", label: "Fotos y videos preevento (subir)" },
  { key: "preevento_ver", label: "Fotos y videos preevento (ver)" },
  { key: "evento_subir", label: "Fotos y videos del evento (subir)" },
  { key: "evento_ver", label: "Fotos y videos del evento (ver)" },
];

async function main() {
  const organization = await db.organization.upsert({
    where: { slug: ORG_SLUG },
    update: {},
    create: { slug: ORG_SLUG, name: ORG_NAME },
  });
  console.log(`Organización lista: ${organization.name} (${organization.slug})`);

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn(
      "Faltan SEED_ADMIN_EMAIL y/o SEED_ADMIN_PASSWORD: me salteo la creación del admin (sin un valor por defecto, para no dejar una contraseña conocida por cualquiera). Definilas en .env si necesitás que el seed cree uno."
    );
  } else {
    const existing = await db.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (!existing) {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await db.user.create({
        data: {
          name: "Administrador",
          email: ADMIN_EMAIL,
          passwordHash,
          role: "ADMIN",
          organizationId: organization.id,
        },
      });
      console.log(`Admin creado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    } else {
      console.log(`Ya existe un admin con el correo ${ADMIN_EMAIL}`);
    }
  }

  if (!MASTER_EMAIL || !MASTER_PASSWORD) {
    console.warn(
      "Faltan SEED_MASTER_EMAIL y/o SEED_MASTER_PASSWORD: me salteo la creación del master. Definilas en .env si necesitás una cuenta para /master."
    );
  } else {
    const existingMaster = await db.user.findUnique({ where: { email: MASTER_EMAIL } });
    if (!existingMaster) {
      const passwordHash = await bcrypt.hash(MASTER_PASSWORD, 10);
      await db.user.create({
        data: {
          name: "Master",
          email: MASTER_EMAIL,
          passwordHash,
          role: "MASTER",
          organizationId: null,
        },
      });
      console.log(`Master creado: ${MASTER_EMAIL} / ${MASTER_PASSWORD}`);
    } else {
      console.log(`Ya existe un master con el correo ${MASTER_EMAIL}`);
    }
  }

  for (const section of SITE_SECTIONS) {
    await db.siteSection.upsert({
      where: { organizationId_key: { organizationId: organization.id, key: section.key } },
      update: {},
      create: {
        organizationId: organization.id,
        key: section.key,
        label: section.label,
        enabled: true,
      },
    });
  }
  console.log(`Secciones del sitio listas (${SITE_SECTIONS.length})`);

  await db.eventSettings.upsert({
    where: { organizationId: organization.id },
    update: {},
    create: {
      organizationId: organization.id,
      tituloEvento: ORG_NAME,
      fechaEvento: new Date("2026-12-12T19:00:00-06:00"),
      lugar: "Salón Jardines del Bosque, Ciudad de Guatemala",
      lema: "Mis XV años",
      indicaciones: "",
      saveTheDateMensaje: "¡Guarda la fecha, no te lo puedes perder!",
    },
  });
  console.log("Configuración del evento lista");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
