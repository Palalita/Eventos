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
  MAX_FILE_SIZE_BYTES,
  OPTIMIZED_JPEG_QUALITY,
  OPTIMIZED_MAX_WIDTH,
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

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona una foto para subir." };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: "Solo se permiten imágenes JPG, PNG o WEBP." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "La imagen no debe superar los 15MB." };
  }

  const original = Buffer.from(await file.arrayBuffer());
  // Recodificar a JPEG y limitar el ancho estira mucho el 1GB gratis de Blob
  // frente a fotos de celular sin comprimir (que suelen pesar varios MB).
  const optimized = await sharp(original)
    .rotate()
    .resize({ width: OPTIMIZED_MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: OPTIMIZED_JPEG_QUALITY })
    .toBuffer();

  const photoId = randomUUID();
  const blob = await put(`${statusFolder("PENDING")}/${photoId}.jpg`, optimized, {
    access: "public",
    contentType: "image/jpeg",
    addRandomSuffix: false,
  });

  await db.photoRequest.create({
    data: {
      id: photoId,
      userId: session.userId,
      fileUrl: blob.url,
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

  const newPathname = `${statusFolder(decision)}/${photo.id}.jpg`;
  const moved = await copy(photo.fileUrl, newPathname, {
    access: "public",
    contentType: "image/jpeg",
  });
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
