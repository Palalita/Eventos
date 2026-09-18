import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { UPLOADS_ROOT, statusFolder } from "@/lib/uploads";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  const { fileName } = await params;

  const photo = await db.photoRequest.findFirst({ where: { fileName } });
  if (!photo) {
    return new Response("No encontrada", { status: 404 });
  }

  if (photo.status !== "APPROVED") {
    const session = await getSession();
    const isOwner = session?.userId === photo.userId;
    const isAdmin = session?.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return new Response("No autorizado", { status: 403 });
    }
  }

  const filePath = path.join(
    UPLOADS_ROOT,
    statusFolder(photo.status),
    photo.fileName
  );

  try {
    const data = await readFile(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return new Response("Archivo no disponible", { status: 404 });
  }
}
