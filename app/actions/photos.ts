"use server";

import { randomUUID } from "node:crypto";
import { copy, del, put } from "@vercel/blob";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifySession, requireAdmin } from "@/lib/dal";
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

export async function uploadPhoto(
  _state: UploadPhotoState,
  formData: FormData
): Promise<UploadPhotoState> {
  const session = await verifySession();

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
      .rotate()
      .resize({ width: OPTIMIZED_MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: OPTIMIZED_JPEG_QUALITY })
      .toBuffer();
    contentType = "image/jpeg";
  }

  const blob = await put(
    `${statusFolder("PENDING")}/${photoId}.${extensionFor(contentType)}`,
    body,
    { access: "public", contentType, addRandomSuffix: false }
  );

  await db.photoRequest.create({
    data: {
      id: photoId,
      userId: session.userId,
      fileUrl: blob.url,
      mediaType: video ? "VIDEO" : "PHOTO",
      phase,
      description,
      status: "PENDING",
    },
  });

  revalidatePath("/");
  return { success: true };
}

export async function reviewPhoto(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const decision = formData.get("decision") as "APPROVED" | "REJECTED";
  const adminComment = (formData.get("comentario") as string | null)?.trim() || null;

  const photo = await db.photoRequest.findUnique({ where: { id } });
  if (!photo || photo.status !== "PENDING") {
    return;
  }

  const extension = photo.fileUrl.split(".").pop();
  const newPathname = `${statusFolder(decision)}/${photo.id}.${extension}`;
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

  revalidatePath("/");
}

export async function checkInGuest(formData: FormData) {
  await requireAdmin();
  const qrToken = formData.get("qrToken") as string;

  const user = await db.user.findUnique({ where: { qrToken } });
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

export type CheckInResult =
  | { status: "ok"; name: string }
  | { status: "already"; name: string }
  | { status: "not_found" };

export async function checkInByToken(qrToken: string): Promise<CheckInResult> {
  await requireAdmin();

  const user = await db.user.findUnique({ where: { qrToken } });
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
