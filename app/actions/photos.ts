"use server";

import { randomUUID } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifySession, requireAdmin } from "@/lib/dal";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  UPLOADS_ROOT,
  extensionFromMime,
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
    return { error: "La imagen no debe superar los 8MB." };
  }

  const folder = path.join(UPLOADS_ROOT, statusFolder("PENDING"));
  await mkdir(folder, { recursive: true });

  const fileName = `${randomUUID()}${extensionFromMime(file.type)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(folder, fileName), buffer);

  await db.photoRequest.create({
    data: {
      userId: session.userId,
      fileName,
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

  const fromFolder = path.join(UPLOADS_ROOT, statusFolder("PENDING"));
  const toFolder = path.join(UPLOADS_ROOT, statusFolder(decision));
  await mkdir(toFolder, { recursive: true });
  await rename(
    path.join(fromFolder, photo.fileName),
    path.join(toFolder, photo.fileName)
  );

  await db.photoRequest.update({
    where: { id },
    data: { status: decision, adminComment, reviewedAt: new Date() },
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
