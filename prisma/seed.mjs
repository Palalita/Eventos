import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@xv.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

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
  const existing = await db.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await db.user.create({
      data: {
        name: "Administrador",
        email: ADMIN_EMAIL,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`Admin creado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    console.log(`Ya existe un admin con el correo ${ADMIN_EMAIL}`);
  }

  for (const section of SITE_SECTIONS) {
    await db.siteSection.upsert({
      where: { key: section.key },
      update: {},
      create: { key: section.key, label: section.label, enabled: true },
    });
  }
  console.log(`Secciones del sitio listas (${SITE_SECTIONS.length})`);

  await db.eventSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      quinceaneraNombre: "Valentina",
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
