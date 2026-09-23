// Server Actions del panel de administración: qué secciones del sitio están
// activas, los datos generales del evento, y revocar dispositivos confiables.
// Las llaman `app/admin/paginas/page.tsx` (updateSiteSections),
// `app/admin/contenido/page.tsx` (updateEventSettings) y
// `app/admin/dispositivos/page.tsx` (revokeTrustedDevice).
"use server";

import { put } from "@vercel/blob";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { SITE_SECTIONS } from "@/lib/site-sections";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  OPTIMIZED_JPEG_QUALITY,
  OPTIMIZED_MAX_WIDTH,
  cinemaPhotoAspectRatioError,
} from "@/lib/uploads";

// El formulario de app/admin/paginas manda un checkbox por sección; los
// desmarcados ni siquiera aparecen en el FormData, por eso se compara contra
// "on" en vez de asumir que la clave existe.
export async function updateSiteSections(formData: FormData) {
  const session = await requireAdmin();

  await Promise.all(
    SITE_SECTIONS.map((section) =>
      db.siteSection.upsert({
        where: {
          organizationId_key: { organizationId: session.organizationId, key: section.key },
        },
        update: { enabled: formData.get(section.key) === "on" },
        create: {
          organizationId: session.organizationId,
          key: section.key,
          label: section.label,
          enabled: formData.get(section.key) === "on",
        },
      })
    )
  );

  // Se revalidan ambas: el panel del evento (que lee getSectionFlags) y la
  // propia página de admin (para que el checkbox recién guardado quede
  // reflejado).
  revalidatePath("/panel");
  revalidatePath("/admin/paginas");
}

export async function updateEventSettings(
  formData: FormData
): Promise<void | { error: string }> {
  const session = await requireAdmin();

  const tituloEvento = (formData.get("tituloEvento") as string)?.trim();
  const lugar = (formData.get("lugar") as string)?.trim();
  const lema = (formData.get("lema") as string)?.trim();
  const fechaEventoRaw = formData.get("fechaEvento") as string;
  const indicaciones = (formData.get("indicaciones") as string)?.trim() ?? "";
  const saveTheDateMensaje = (formData.get("saveTheDateMensaje") as string)?.trim() ?? "";

  // Si faltan los campos obligatorios, se corta en silencio (el formulario ya
  // los marca required en el HTML; esto es un resguardo del lado servidor).
  if (!tituloEvento || !lugar || !lema || !fechaEventoRaw) {
    return;
  }

  // El input datetime-local no incluye zona horaria; se fija a Guatemala
  // (UTC-6) para que la hora que escribe el admin sea la hora real del salón,
  // sin depender de en qué zona horaria corra el servidor.
  const fechaEvento = new Date(`${fechaEventoRaw}:00-06:00`);

  const fotoPrincipal = formData.get("fotoPrincipal");
  let fotoPrincipalUrl: string | undefined;
  if (fotoPrincipal instanceof File && fotoPrincipal.size > 0) {
    // La foto principal es opcional en este formulario: solo se procesa (y
    // se pisa en la BD) si el admin efectivamente adjuntó una nueva.
    if (!ALLOWED_IMAGE_TYPES.includes(fotoPrincipal.type)) {
      return;
    }
    if (fotoPrincipal.size > MAX_IMAGE_SIZE_BYTES) {
      return;
    }
    const buffer = Buffer.from(await fotoPrincipal.arrayBuffer());

    // Esta foto es la que usa el hero cinemático como fondo a pantalla
    // completa (ver lib/uploads.ts#cinemaPhotoAspectRatioError) — con el
    // layout clásico no hace falta chequear nada, va en un marco chico.
    const organization = await db.organization.findUniqueOrThrow({
      where: { id: session.organizationId },
      select: { layout: true },
    });
    if (organization.layout === "cinematica") {
      const metadata = await sharp(buffer).metadata();
      const aspectRatioError = cinemaPhotoAspectRatioError(metadata.width, metadata.height);
      if (aspectRatioError) {
        return { error: aspectRatioError };
      }
    }

    const body = await sharp(buffer)
      .rotate()
      .resize({ width: OPTIMIZED_MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: OPTIMIZED_JPEG_QUALITY })
      .toBuffer();
    // Mismo nombre de archivo siempre (por organización) + allowOverwrite:
    // true, así cada foto principal nueva reemplaza a la anterior de ESA
    // organización en vez de acumular blobs viejos o pisar la de otro cliente.
    const blob = await put(`settings/${session.organizationId}/foto-principal.jpg`, body, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    fotoPrincipalUrl = blob.url;
  }

  await db.eventSettings.update({
    where: { organizationId: session.organizationId },
    data: {
      tituloEvento,
      lugar,
      lema,
      fechaEvento,
      indicaciones,
      saveTheDateMensaje,
      ...(fotoPrincipalUrl ? { fotoPrincipalUrl } : {}),
    },
  });

  // Se revalidan todas las páginas que muestran estos datos. /login ya no
  // lee EventSettings (ver app/login/page.tsx), así que no hace falta
  // revalidarla.
  revalidatePath("/panel");
  revalidatePath("/admin/contenido");
  revalidatePath("/registro");
}

// El admin puede "olvidar" un dispositivo desde app/admin/dispositivos: la
// próxima vez que se loguee desde ese navegador, va a tener que volver a
// confirmar por correo.
export async function revokeTrustedDevice(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string;

  // Se filtra también por userId: un admin solo puede borrar sus propios
  // dispositivos, nunca los de otro admin.
  await db.trustedDevice.deleteMany({ where: { id, userId: session.userId } });

  revalidatePath("/admin/dispositivos");
}
