// Server Actions del ciclo de vida de una foto/video: subirla, revisarla
// (aprobar/rechazar) y el check-in de invitados por QR.
//
// Quién las llama:
// - uploadPhoto ← app/UploadForm.tsx (subida de fotos; los videos van por
//   createUploadedVideoRequest, ver el comentario de esa función)
// - reviewPhoto ← app/PendingList.tsx (botones aprobar/rechazar del admin)
// - checkInGuest ← formulario de confirmar asistencia en
//   app/invitacion/[token]/page.tsx
// - checkInByToken ← app/admin/invitados/QrScanner.tsx (al escanear un QR)
"use server";

import { randomUUID } from "node:crypto";
import { copy, del, put } from "@vercel/blob";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOrgSession, requireAdmin } from "@/lib/dal";
import {
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  OPTIMIZED_JPEG_QUALITY,
  OPTIMIZED_MAX_WIDTH,
  extensionFor,
  isVideo,
  statusFolder,
} from "@/lib/uploads";

export type UploadPhotoState =
  | { error: string }
  | { success: true }
  | undefined;

// Sube una foto (o un video chico) directo desde el formulario: el archivo
// viaja del navegador al servidor dentro del FormData, y de acá sale hacia
// Vercel Blob. Para videos grandes se usa en cambio createUploadedVideoRequest,
// porque los Server Actions tienen límite de tamaño de body.
export async function uploadPhoto(
  _state: UploadPhotoState,
  formData: FormData
): Promise<UploadPhotoState> {
  const session = await requireOrgSession(); // tiene que haber alguien logueado con organización

  const file = formData.get("foto");
  const description = (formData.get("descripcion") as string | null)?.trim() || null;
  const phase = formData.get("phase") === "PRE_EVENT" ? "PRE_EVENT" : "EVENT";

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona una foto o video para subir." };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: "Solo se permiten imágenes (JPG, PNG, WEBP) o videos (MP4, MOV, WEBM)." };
  }

  const video = isVideo(file.type);
  const maxSize = video ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  if (file.size > maxSize) {
    return {
      error: video
        ? "El video no debe superar los 80MB."
        : "La imagen no debe superar los 15MB.",
    };
  }

  const photoId = randomUUID();

  // Todo lo que sigue puede fallar de formas que no controlamos (imagen
  // corrupta que sharp no puede procesar, Blob caído, DB sin conexión). Sin
  // este try/catch, un fallo así tira una excepción sin capturar: el cliente
  // (ver UploadForm.tsx) espera que esta acción SIEMPRE resuelva un
  // UploadPhotoState — si en cambio la promesa rechaza, su guarda contra
  // doble envío (isSubmittingRef) queda trabada en `true` para siempre,
  // porque nunca llega un nuevo estado que la resetee.
  try {
    let contentType = file.type;
    let body: Buffer;

    if (video) {
      // Los videos no se recomprimen (requeriría un transcodificador aparte);
      // se suben tal cual, respetando el límite de tamaño.
      body = Buffer.from(await file.arrayBuffer());
    } else {
      // Recodificar a JPEG y limitar el ancho estira mucho el 1GB gratis de
      // Blob frente a fotos de celular sin comprimir (varios MB cada una).
      body = await sharp(Buffer.from(await file.arrayBuffer()))
        .rotate() // corrige la orientación EXIF (fotos de celular "acostadas")
        .resize({ width: OPTIMIZED_MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: OPTIMIZED_JPEG_QUALITY })
        .toBuffer();
      contentType = "image/jpeg";
    }

    // `put` sube el archivo a Vercel Blob y devuelve su URL pública. Toda
    // foto nueva arranca en la carpeta "pending/" hasta que el admin la
    // revise.
    const blob = await put(
      `${statusFolder("PENDING")}/${photoId}.${extensionFor(contentType)}`,
      body,
      { access: "public", contentType, addRandomSuffix: false }
    );

    await db.photoRequest.create({
      data: {
        id: photoId,
        userId: session.userId,
        organizationId: session.organizationId,
        fileUrl: blob.url,
        mediaType: video ? "VIDEO" : "PHOTO",
        phase,
        description,
        status: "PENDING",
      },
    });
  } catch (error) {
    console.error(`[uploadPhoto] Falló la subida para el usuario ${session.userId}:`, error);
    return { error: "No se pudo subir el archivo. Intentá de nuevo." };
  }

  revalidatePath("/panel"); // para que la galería/lista de pendientes se actualice
  return { success: true };
}

// Usado tras una subida directa navegador -> Vercel Blob (ver UploadForm):
// el archivo ya está en Blob, aquí solo se crea el registro en la BD.
export async function createUploadedVideoRequest(input: {
  photoId: string;
  fileUrl: string;
  phase: "PRE_EVENT" | "EVENT";
  description: string | null;
}) {
  const session = await requireOrgSession();

  // El navegador es quien decide el nombre del archivo al subirlo
  // directamente a Blob (ver app/api/upload/route.ts), así que acá se
  // revalida que la URL tenga la forma esperada (carpeta "pending/" + el
  // mismo photoId) antes de confiar en ella y guardarla en la BD.
  if (!input.fileUrl.includes(`pending/${input.photoId}.`)) {
    throw new Error("URL de archivo inválida");
  }

  await db.photoRequest.create({
    data: {
      id: input.photoId,
      userId: session.userId,
      organizationId: session.organizationId,
      fileUrl: input.fileUrl,
      mediaType: "VIDEO",
      phase: input.phase,
      description: input.description,
      status: "PENDING",
    },
  });

  revalidatePath("/panel");
}

// El admin aprueba o rechaza una foto/video pendiente: mueve el archivo de
// carpeta en Blob ("pending/" -> "approved/" o "rejected/") y actualiza el
// estado en la BD.
export async function reviewPhoto(formData: FormData) {
  const session = await requireAdmin();

  const id = formData.get("id") as string;
  const decision = formData.get("decision") as "APPROVED" | "REJECTED";
  const adminComment = (formData.get("comentario") as string | null)?.trim() || null;

  // findFirst con organizationId (no findUnique solo por id): sin este
  // filtro, un admin podría aprobar/rechazar fotos de OTRA organización
  // simplemente adivinando o reusando un id de PhotoRequest ajeno.
  const photo = await db.photoRequest.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!photo || photo.status !== "PENDING") {
    // Ya fue revisada, no existe, o es de otra organización: no hacemos
    // nada, evita doble-procesar si el admin hace doble clic o recarga.
    return;
  }

  const extension = photo.fileUrl.split(".").pop();
  const newPathname = `${statusFolder(decision)}/${photo.id}.${extension}`;
  // Blob no tiene "mover"; se copia al nuevo path y se borra el original.
  const moved = await copy(photo.fileUrl, newPathname, { access: "public" });
  await del(photo.fileUrl);

  await db.photoRequest.update({
    where: { id },
    data: {
      status: decision,
      adminComment,
      reviewedAt: new Date(),
      fileUrl: moved.url,
    },
  });

  revalidatePath("/panel");
}

// Marca la asistencia de un invitado desde su propia página de invitación
// (app/invitacion/[token]/page.tsx), cuando el admin confirma "a mano" en
// persona en vez de escanear el QR.
export async function checkInGuest(formData: FormData) {
  const session = await requireAdmin();
  const qrToken = formData.get("qrToken") as string;

  // findFirst con organizationId: un QR es un token aleatorio único, pero
  // sin este filtro un admin podría marcar asistencia de un invitado de
  // OTRA organización si de alguna forma llegara a conocer/probar su token.
  const user = await db.user.findFirst({
    where: { qrToken, organizationId: session.organizationId },
  });
  if (!user) {
    redirect("/admin/invitados?error=no-encontrado");
  }

  await db.user.update({
    where: { id: user.id },
    data: { attended: true, checkedInAt: new Date() },
  });

  revalidatePath("/admin/invitados");
  redirect(`/admin/invitados?ok=${user.id}`);
}

// Resultado del check-in por QR: QrScanner.tsx usa esto para mostrar un
// mensaje distinto según si funcionó, ya estaba marcado, o el código no
// corresponde a nadie (sin redirigir, porque el escáner se queda en la
// misma pantalla escaneando el siguiente invitado).
export type CheckInResult =
  | { status: "ok"; name: string }
  | { status: "already"; name: string }
  | { status: "not_found" };

export async function checkInByToken(qrToken: string): Promise<CheckInResult> {
  const session = await requireAdmin();

  const user = await db.user.findFirst({
    where: { qrToken, organizationId: session.organizationId },
  });
  if (!user) {
    return { status: "not_found" };
  }
  if (user.attended) {
    return { status: "already", name: user.name };
  }

  await db.user.update({
    where: { id: user.id },
    data: { attended: true, checkedInAt: new Date() },
  });

  revalidatePath("/admin/invitados");
  return { status: "ok", name: user.name };
}
