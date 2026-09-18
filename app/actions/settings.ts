"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { SITE_SECTIONS } from "@/lib/site-sections";

export async function updateSiteSections(formData: FormData) {
  await requireAdmin();

  await Promise.all(
    SITE_SECTIONS.map((section) =>
      db.siteSection.upsert({
        where: { key: section.key },
        update: { enabled: formData.get(section.key) === "on" },
        create: {
          key: section.key,
          label: section.label,
          enabled: formData.get(section.key) === "on",
        },
      })
    )
  );

  revalidatePath("/");
  revalidatePath("/admin/paginas");
}

export async function updateEventSettings(formData: FormData) {
  await requireAdmin();

  const quinceaneraNombre = (formData.get("quinceaneraNombre") as string)?.trim();
  const lugar = (formData.get("lugar") as string)?.trim();
  const lema = (formData.get("lema") as string)?.trim();
  const fechaEventoRaw = formData.get("fechaEvento") as string;
  const indicaciones = (formData.get("indicaciones") as string)?.trim() ?? "";
  const saveTheDateMensaje = (formData.get("saveTheDateMensaje") as string)?.trim() ?? "";

  if (!quinceaneraNombre || !lugar || !lema || !fechaEventoRaw) {
    return;
  }

  // El input datetime-local no incluye zona horaria; se fija a Guatemala
  // (UTC-6) para que la hora que escribe el admin sea la hora real del salón,
  // sin depender de en qué zona horaria corra el servidor.
  const fechaEvento = new Date(`${fechaEventoRaw}:00-06:00`);

  await db.eventSettings.update({
    where: { id: "singleton" },
    data: {
      quinceaneraNombre,
      lugar,
      lema,
      fechaEvento,
      indicaciones,
      saveTheDateMensaje,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/contenido");
  revalidatePath("/login");
  revalidatePath("/registro");
}

export async function revokeTrustedDevice(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string;

  await db.trustedDevice.deleteMany({ where: { id, userId: session.userId } });

  revalidatePath("/admin/dispositivos");
}
